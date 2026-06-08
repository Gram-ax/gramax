import Path from "@core/FileProvider/Path/Path";

export type CatalogItemLookup = {
	catalogName: string;
	itemPath: string;
	fullPath: Path;
};

export function normalizePath(input: string): string {
	return input
		.trim()
		.replace(/^[/\\]+/, "")
		.replace(/\\/g, "/");
}

export function buildPath(catalogName: string, itemPath: string): string {
	const cat = normalizePath(catalogName);
	const rel = normalizePath(itemPath);
	return `${cat}/${rel}`;
}

export function buildCatalogItemLookup(catalogName: string, itemPath: string): CatalogItemLookup {
	const catalogNameNormalized = normalizePath(catalogName);
	const itemPathNormalized = normalizePath(itemPath);
	return {
		catalogName: catalogNameNormalized,
		itemPath: itemPathNormalized,
		fullPath: new Path(buildPath(catalogNameNormalized, itemPathNormalized)),
	};
}
