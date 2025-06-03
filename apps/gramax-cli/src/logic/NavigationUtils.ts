import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";

export const getItemLinks = async (catalog: Catalog, currentItemLogicPath: string, sitePresenter: SitePresenter) => {
	const itemLinks = await sitePresenter.getCatalogNav(catalog, currentItemLogicPath);
	updatePathnames(catalog, itemLinks);
	return itemLinks;
};

const updatePathnames = (catalog: Catalog, itemLinks: ItemLink[]) => {
	const processItems = (items: ItemLink[]) =>
		items.forEach((itemLink) => {
			itemLink.ref.storageId = "";
			itemLink.ref.path = replacePathIfNeeded(itemLink.ref.path, catalog);
			itemLink.pathname = RouterPathProvider.getLogicPath(itemLink.pathname);

			if ((itemLink as CategoryLink).items) {
				processItems((itemLink as CategoryLink).items);
			}
		});

	processItems(itemLinks);
};

export const replacePathIfNeeded = (path: string, catalog: Catalog): string => {
	const catalogFolderPath = catalog.getRootCategory().folderPath.value;
	const catalogBasePath = catalog.basePath.value;
	return path.replace(catalogFolderPath, catalogBasePath);
};
