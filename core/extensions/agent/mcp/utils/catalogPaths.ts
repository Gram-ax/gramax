import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import assert from "assert";

export class CatalogItemLookup {
	readonly catalogName: string;
	readonly itemPath: string;
	readonly title: string;
	readonly link: string;

	constructor(catalogName: string, itemPath: string, title = "", link = "") {
		this.catalogName = CatalogItemLookup.normalizePath(catalogName);
		this.itemPath = CatalogItemLookup.normalizePath(itemPath);
		this.title = title;
		this.link = link;
	}

	static async fromCatalogItem(catalog: Catalog | ContextualCatalog, item: Item): Promise<CatalogItemLookup> {
		const link = await catalog.getPathname(item);
		return new CatalogItemLookup(
			catalog.name,
			catalog.getRepositoryRelativePath(item.ref).value,
			item.getTitle() ?? "",
			link,
		);
	}

	asPath(): Path {
		return new Path(`${this.catalogName}/${this.itemPath}`);
	}

	asJSON() {
		return {
			catalogName: this.catalogName,
			itemPath: this.itemPath,
			title: this.title,
			link: this.link,
		};
	}

	static normalizePath(input: string): string {
		return input
			.trim()
			.replace(/^[/\\]+/, "")
			.replace(/\\/g, "/");
	}

	static getTypeFromPath(itemPath: string): ItemType | null {
		// used when item is not exists yet
		if (itemPath.endsWith("_index.md")) return ItemType.category;
		if (itemPath.endsWith(".md")) return ItemType.article;
		return null;
	}

	static assertResolvedUnderPath(basePath: Path, resolvedPath: Path): void {
		const base = basePath.removeExtraSymbols.value;
		const target = resolvedPath.removeExtraSymbols.value;
		assert(
			target.startsWith(base.endsWith("/") ? base : `${base}/`) || target === base,
			"Path resolves outside base path",
		);
	}
}
