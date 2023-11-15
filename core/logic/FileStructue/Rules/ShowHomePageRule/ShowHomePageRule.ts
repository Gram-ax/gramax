import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";

export default class ShowHomePageRule {
	getNavCatalogRule() {
		return (catalog: CatalogEntry): boolean => {
			return catalog.props[showHomePageProps.showHomePage] ?? true;
		};
	}
}

export enum showHomePageProps {
	showHomePage = "showHomePage",
}
