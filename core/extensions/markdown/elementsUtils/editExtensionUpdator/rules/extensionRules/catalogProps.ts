import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getCatalogPropsRule = (catalogProps: ClientCatalogProps): ExtensionUpdaterRules => {
	const filterNames = ["selectionMenu", "link", "diff"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { catalogProps },
	};
};

export default getCatalogPropsRule;
