import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type SitePresenter from "@core/SitePresenter/SitePresenter";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";

export const getItemLinks = async (
	catalog: ReadonlyCatalog,
	currentItemLogicPath: string,
	sitePresenter: SitePresenter,
	singleCatalog = false,
) => {
	const itemLinks = await sitePresenter.getCatalogNav(catalog, currentItemLogicPath);
	updatePathnames(catalog, itemLinks, singleCatalog);
	return itemLinks;
};

export const stripCatalogPrefix = (path: string, catalogName: string): string => {
	if (!path || !catalogName) return path;
	const hasLeadingSlash = path.startsWith("/");
	const normalized = hasLeadingSlash ? path.substring(1) : path;
	if (normalized === catalogName) return "";
	if (normalized.startsWith(`${catalogName}/`)) return normalized.substring(catalogName.length + 1);
	return path;
};

const updatePathnames = (catalog: ReadonlyCatalog, itemLinks: ItemLink[], singleCatalog: boolean) => {
	const catalogName = catalog.name;

	const processItems = (items: ItemLink[]) =>
		items.forEach((itemLink) => {
			itemLink.ref.storageId = "";
			itemLink.ref.path = replacePathIfNeeded(itemLink.ref.path, catalog);
			itemLink.pathname = RouterPathProvider.getLogicPath(itemLink.pathname);

			if (singleCatalog) {
				itemLink.pathname = stripCatalogPrefix(itemLink.pathname, catalogName);
				itemLink.ref.path = stripCatalogPrefix(itemLink.ref.path, catalogName);
			}

			if ((itemLink as CategoryLink).items) {
				processItems((itemLink as CategoryLink).items);
			}
		});

	processItems(itemLinks);
};

export const replacePathIfNeeded = (path: string, catalog: ReadonlyCatalog): string => {
	const catalogFolderPath = catalog.getRootCategory().folderPath.value;
	const catalogBasePath = catalog.basePath.value;
	const replaced = path.replace(catalogFolderPath, catalogBasePath);
	if (typeof process !== "undefined" && process.env?.GRAMAX_SINGLE_CATALOG === "true") {
		return stripCatalogPrefix(replaced, catalog.name);
	}
	return replaced;
};
