import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { addScopeToPath } from "@ext/versioning/utils";
import type { Workspace } from "@ext/workspace/Workspace";

export default class CatalogVersionResolver implements EventHandlerCollection {
	private _catalogs = new WeakMap<Catalog, Map<string, CatalogEntry>>();

	constructor(private _workspace: Workspace, private _rp: RepositoryProvider) {}

	mount(): void {
		if (getExecutingEnvironment() !== "next") return; // todo: add support in editor

		this._workspace.events.on("on-catalog-resolve", async ({ mutableCatalog, metadata }) => {
			const refname = metadata;
			if (!refname) return;

			if (!mutableCatalog.catalog) return;

			const gvc = mutableCatalog.catalog?.repo?.gvc;
			if (!gvc) return;
			if (!mutableCatalog.catalog.props.resolvedVersions?.find((t) => t.encodedName == refname)) return;

			const versions = this._catalogs.get(mutableCatalog.catalog);
			if (versions) {
				const catalog = versions.get(refname);
				if (catalog) mutableCatalog.catalog = await catalog.load();
			}
		});

		this._workspace.events.on("on-catalog-entry-resolve", async ({ mutableEntry, name, metadata }) => {
			const refname = metadata;
			if (!refname) return;

			if (!mutableEntry.entry) {
				const split = name?.split("/");
				if (split?.length == 2) mutableEntry.entry = await this._workspace.getContextlessCatalog(split[0]);
			}

			const gvc = mutableEntry.entry?.repo?.gvc;
			if (!gvc) return;
			if (!mutableEntry.entry.props.resolvedVersions?.find((t) => t.encodedName == refname)) return;

			// Catalog versions are only loaded if the catalog itself is loaded.
			// As long as Catalog.load() returns this and the reference will be the same, this will work
			const versions = this._catalogs.get(mutableEntry.entry.upgrade("catalog"));
			if (versions) {
				const catalog = versions.get(refname);
				if (catalog) mutableEntry.entry = catalog;
			}
		});

		this._workspace.events.on("add-catalog", async ({ catalog }) => {
			if (!catalog.repo) return;

			await this._updateCatalog(catalog);
			catalog.repo.events.on("sync", async () => {
				await this._updateCatalog(catalog);
			});
		});
	}

	// TODO: Store oid->refname mapping and compare oids to detect changes; don't reset the versioned catalog if it's not needed
	private async _updateCatalog(catalog: Catalog) {
		if (!catalog?.repo?.gvc || !catalog.props.versions) {
			if (this._catalogs.get(catalog)) this._catalogs.delete(catalog);
			return;
		}

		let gitfp = this._workspace.getFileProvider().at(catalog.basePath);
		if (!(gitfp instanceof GitTreeFileProvider)) {
			const git = new GitCommands(this._workspace.getFileProvider().default(), catalog.basePath);
			gitfp = new GitTreeFileProvider(git);
		}

		const entries = new Map();
		catalog.props.resolvedVersions = await catalog.repo.gvc.getReferencesByGlob(catalog.props.versions);

		const fs = this._workspace.getFileStructure();

		for (const resolvedVersion of catalog.props.resolvedVersions) {
			const path = addScopeToPath(catalog.basePath, resolvedVersion.name);
			fs.fp.mount(new Path(path), gitfp);

			const entry = await fs.getCatalogEntryByPath(new Path(path), false, {
				resolvedVersion,
				versions: catalog.props.versions,
				resolvedVersions: catalog.props.resolvedVersions,
			});
			entry.setRepository(catalog.repo);
			entry.setLoadCallback((c) => {
				c.events.on("update", () => catalog.update());
				c.setRepository(catalog.repo);
				entries.set(resolvedVersion.encodedName, c);
			});
			entries.set(resolvedVersion.encodedName, entry);
		}

		this._catalogs.set(catalog, entries);
	}
}
