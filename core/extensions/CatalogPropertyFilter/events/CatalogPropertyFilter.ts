import type { EventArgs } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import ReadOnlyDiskFileProvider from "@core/FileProvider/DiskFileProvider/ReadOnlyDiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type { FSEvents } from "@core/FileStructue/FileStructure";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { feature } from "@ext/toggleFeatures/features";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { addScopeToPath } from "@ext/versioning/utils";
import type { Workspace } from "@ext/workspace/Workspace";

export default class CatalogTagFilter implements EventHandlerCollection {
	private _catalogs = new WeakMap<Catalog, Map<string, CatalogEntry>>();
	private _events = [];

	constructor(private _workspace: Workspace) {}

	mount(): void {
		if (!feature("filtered-catalog")) return;

		const fs = this._workspace.getFileStructure();

		this._events.push(
			fs.events.on("category-filter", this._categoryFilter.bind(this)),
			fs.events.on("item-filter", this._itemFilter.bind(this)),

			this._workspace.events.on("on-catalog-resolve", async ({ mutableCatalog, metadata }) => {
				const property = metadata;
				if (!property || !mutableCatalog.catalog) return;
				if (!mutableCatalog.catalog.props.filterProperties?.includes(property)) return;

				const filteredCatalog = this._catalogs.get(mutableCatalog.catalog);
				if (filteredCatalog) {
					const catalog = filteredCatalog.get(property);
					if (catalog) mutableCatalog.catalog = await catalog.load();
				}
			}),

			this._workspace.events.on("on-catalog-entry-resolve", async ({ mutableEntry, name, metadata }) => {
				const property = metadata;
				if (!property) return;

				if (!mutableEntry.entry) {
					mutableEntry.entry = await this._workspace.getContextlessCatalog(name);
				}

				if (!mutableEntry.entry.props.filterProperties?.includes(property)) return;

				// Catalog versions are only loaded if the catalog itself is loaded.
				// As long as Catalog.load() returns this and the reference will be the same, this will work
				const filteredCatalogs = this._catalogs.get(mutableEntry.entry.upgrade("catalog"));
				if (filteredCatalogs) {
					const catalog = filteredCatalogs.get(property);
					if (catalog) mutableEntry.entry = catalog;
				}
			}),

			this._workspace.events.on("add-catalog", async ({ catalog }) => {
				await this._updateCatalog(catalog);

				catalog.events.on("update", async () => {
					await this._updateCatalog(catalog);
				});

				catalog.events.on("item-props-updated", async ({ item, props, catalog }) => {
					if (catalog.props.resolvedFilterProperty || catalog.props.resolvedVersion) return;

					const itemProps = new Set(item.props.properties?.map((p) => p.name) || []);
					const updateProps = new Set(props.properties?.map((p) => p.name) || []);

					if (itemProps.difference(updateProps).intersection(new Set(catalog.props.filterProperties)))
						await this._updateCatalog(catalog);
				});
			}),
		);
	}

	private _categoryFilter({ item, catalogProps }: EventArgs<FSEvents, "category-filter">): boolean {
		if (!catalogProps.resolvedFilterProperty) return true;
		return !!item.props.properties?.some((p) => p.name == catalogProps.resolvedFilterProperty);
	}

	private _itemFilter({ item, catalogProps }: EventArgs<FSEvents, "item-filter">): boolean {
		if (!catalogProps.resolvedFilterProperty || item.type === "category") return true;
		return !!item.props.properties?.some((p) => p.name == catalogProps.resolvedFilterProperty);
	}

	private async _updateCatalog(catalog: Catalog) {
		if (!catalog.props.filterProperties) return;

		const entries = new Map();

		const fs = this._workspace.getFileStructure();

		for (const filterTag of catalog.props.filterProperties) {
			const realPath = catalog.basePath;
			const virtualPath = new Path(addScopeToPath(realPath, filterTag));

			const parentFp = fs.fp.at(realPath);

			if (parentFp instanceof GitTreeFileProvider) {
				const gitfp = new GitCommands(fs.fp, realPath);
				const fp = new GitTreeFileProvider(gitfp);
				fs.fp.mount(virtualPath, fp);
			} else {
				const fp = new ReadOnlyDiskFileProvider(realPath);
				fs.fp.mount(virtualPath, fp, true);
			}

			const entry = await fs.getCatalogEntryByPath(virtualPath, false, {
				resolvedFilterProperty: filterTag,
				filterProperties: catalog.props.filterProperties,
			});

			entry.setRepository(catalog.repo);
			entry.setLoadCallback((c) => {
				c.events.on("update", () => catalog.update());
				c.setRepository(catalog.repo);
				entries.set(filterTag, c);
			});
			entries.set(filterTag, entry);
		}

		this._catalogs.set(catalog, entries);
	}
}
