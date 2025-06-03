import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getCatalogPropsRule = (catalogProps: ClientCatalogProps): ExtensionUpdaterRules => {
	const filterNames = ["selectionMenu", "link"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { catalogProps },
	};
};

export default getCatalogPropsRule;
