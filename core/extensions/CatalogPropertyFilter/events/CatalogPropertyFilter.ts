import type { EventArgs } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import ReadOnlyDiskFileProvider from "@core/FileProvider/DiskFileProvider/ReadOnlyDiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type { FSEvents } from "@core/FileStructue/FileStructure";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { enumTypes, PropertyTypes } from "@ext/properties/models";
import { feature } from "@ext/toggleFeatures/features";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { addScopeToPath } from "@ext/versioning/utils";
import type { Workspace } from "@ext/workspace/Workspace";

export default class CatalogPropertyFilter implements EventHandlerCollection {
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
				const filterValue = metadata;
				if (!filterValue || !mutableCatalog.catalog) return;
				if (!mutableCatalog.catalog.props.filterProperty) return;

				const filteredCatalog = this._catalogs.get(mutableCatalog.catalog);
				if (filteredCatalog) {
					const catalog = filteredCatalog.get(filterValue);
					if (catalog) mutableCatalog.catalog = await catalog.load();
				}
			}),

			this._workspace.events.on("on-catalog-entry-resolve", async ({ mutableEntry, name, metadata }) => {
				const filterValue = metadata;
				if (!filterValue) return;

				if (!mutableEntry.entry) {
					mutableEntry.entry = await this._workspace.getContextlessCatalog(name);
					if (!mutableEntry.entry) return;
				}

				if (!mutableEntry.entry.props.filterProperty) return;

				// Catalog versions are only loaded if the catalog itself is loaded.
				// As long as Catalog.load() returns this and the reference will be the same, this will work
				const filteredCatalogs = this._catalogs.get(mutableEntry.entry.upgrade("catalog"));
				if (filteredCatalogs) {
					const catalog = filteredCatalogs.get(filterValue);
					if (catalog) mutableEntry.entry = catalog;
				}
			}),

			this._workspace.events.on("add-catalog", async ({ catalog }) => {
				await this._updateCatalog(catalog);

				catalog.events.on("update", async () => {
					await this._updateCatalog(catalog);
				});

				catalog.events.on("item-props-updated", async ({ item, props, catalog }) => {
					if (catalog.props.resolvedFilterPropertyValue || catalog.props.resolvedVersion) return;

					const itemProps = new Set(item.props.properties?.map((p) => p.name) || []);
					const updateProps = new Set(props.properties?.map((p) => p.name) || []);

					if (
						catalog.props.filterProperty &&
						(itemProps.has(catalog.props.filterProperty) || updateProps.has(catalog.props.filterProperty))
					)
						await this._updateCatalog(catalog);
				});
			}),
		);
	}

	private _categoryFilter({ item, catalogProps }: EventArgs<FSEvents, "category-filter">): boolean {
		if (!catalogProps.resolvedFilterPropertyValue || !catalogProps.filterProperty) return true;

		if (!item.parent.parent && item.type === ItemType.category) {
			const maybeItemLanguage = ContentLanguage[item.getFileName()];
			if (catalogProps.supportedLanguages.includes(maybeItemLanguage)) return true;
		}

		return this._matchesFilter(item, catalogProps.filterProperty, catalogProps.resolvedFilterPropertyValue);
	}

	private _itemFilter({ item, catalogProps }: EventArgs<FSEvents, "item-filter">): boolean {
		if (!catalogProps.resolvedFilterPropertyValue || !catalogProps.filterProperty || item.type === "category")
			return true;
		return this._matchesFilter(item, catalogProps.filterProperty, catalogProps.resolvedFilterPropertyValue);
	}

	private _matchesFilter(item: Item, propertyName: string, filterValue: string): boolean {
		const itemProperty = item.props.properties?.find((p) => p.name === propertyName);

		if (!itemProperty) return false;

		// flag or 'any' property value
		if (!itemProperty?.value || filterValue === "any") return true;

		const itemValues = Array.isArray(itemProperty.value) ? itemProperty.value : [itemProperty.value];
		return itemValues.includes(filterValue);
	}

	private async _updateCatalog(catalog: Catalog) {
		if (!catalog.props.filterProperty) return;

		const entries = new Map();
		const fs = this._workspace.getFileStructure();

		const property = catalog.props.properties?.find((p) => p.name === catalog.props.filterProperty);
		if (!property) return;

		const filterValues = new Set<string>();

		filterValues.add("any");

		if (property.type === PropertyTypes.flag) {
			filterValues.add(property.name);
		}

		if (enumTypes.includes(property.type) && property.values)
			property.values.forEach((value) => filterValues.add(value));

		for (const filterValue of filterValues) {
			const realPath = catalog.basePath;
			const virtualPath = new Path(addScopeToPath(realPath, filterValue, false));

			const parentFp = fs.fp.at(realPath);

			if (parentFp instanceof GitTreeFileProvider) {
				const gitfp = new GitCommands(fs.fp, realPath);
				const fp = new GitTreeFileProvider(gitfp, true);
				fs.fp.mount(virtualPath, fp);
			} else {
				const fp = new ReadOnlyDiskFileProvider(realPath);
				fs.fp.mount(virtualPath, fp, true);
			}

			const entry = await fs.getCatalogEntryByPath(virtualPath, false, {
				resolvedFilterPropertyValue: filterValue,
				filterProperty: catalog.props.filterProperty,
			});

			entry.setRepository(catalog.repo);
			entry.setLoadCallback((c) => {
				c.events.on("update", () => catalog.update());
				c.setRepository(catalog.repo);
				entries.set(filterValue, c);
			});
			entries.set(filterValue, entry);
		}

		this._catalogs.set(catalog, entries);
	}
}
