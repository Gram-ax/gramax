import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import SitePresenter from "@core/SitePresenter/SitePresenter";
import { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";

export const getItemLinks = async (
	catalog: ReadonlyCatalog,
	currentItemLogicPath: string,
	sitePresenter: SitePresenter,
) => {
	const itemLinks = await sitePresenter.getCatalogNav(catalog, currentItemLogicPath);
	updatePathnames(itemLinks);
	return itemLinks;
};

const updatePathnames = (itemLinks: ItemLink[]) => {
	itemLinks.forEach((itemLink) => {
		itemLink.ref.storageId = "";
		itemLink.pathname = RouterPathProvider.getLogicPath(itemLink.pathname);
		if ((itemLink as CategoryLink).items) {
			updatePathnames((itemLink as CategoryLink).items);
		}
	});
};
