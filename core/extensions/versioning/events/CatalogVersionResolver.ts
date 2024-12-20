import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import type { Workspace } from "@ext/workspace/Workspace";

const VERSION_LIMIT = 32;

export default class CatalogVersionResolver implements EventHandlerCollection, EventHandlerCollection {
	private _catalogs = new WeakMap<Catalog, Map<string, CatalogEntry>>();

	constructor(private _workspace: Workspace, private _rp: RepositoryProvider) {}

	mount(): void {
		if (getExecutingEnvironment() !== "next") return; // todo: добавить поддержку в редакторе

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

			// Версии каталога загружаются только если сам каталог загружен.
			// Пока Catalog.load() возвращает this и ссылка будет одной и той же, это будет работать
			const versions = this._catalogs.get(mutableEntry.entry.upgrade("catalog"));
			if (versions) {
				const catalog = versions.get(refname);
				if (catalog) mutableEntry.entry = catalog;
			}
		});

		this._workspace.events.on("add-catalog", async ({ catalog }) => {
			if (!catalog?.repo?.gvc || !catalog.props.versions) return;

			if ((await catalog.repo.gvc.getSubGitVersionControls()).length > 0) {
				console.warn(
					`skipping version resolving for catalog ${catalog.basePath.value}; submodules aren't currently supported for bare repositories`,
				);
			}

			let gitfp = this._workspace.getFileProvider().at(catalog.basePath);
			if (!(gitfp instanceof GitTreeFileProvider))
				gitfp = new GitTreeFileProvider(
					new GitCommands(this._workspace.getFileProvider().default(), catalog.basePath),
				);

			const entries = new Map();
			const versions = await catalog.repo.gvc.getReferencesByGlob(catalog.props.versions);
			catalog.props.resolvedVersions = versions.slice(0, VERSION_LIMIT);

			const fs = this._workspace.getFileStructure();

			for (const resolvedVersion of catalog.props.resolvedVersions) {
				const basePath = catalog.basePath;
				const path = basePath.value + `:${resolvedVersion.encodedName}`;
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
		});
	}
}
