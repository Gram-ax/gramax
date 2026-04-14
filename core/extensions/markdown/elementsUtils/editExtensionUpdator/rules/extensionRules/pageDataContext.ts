import type PageDataContext from "../../../../../../logic/Context/PageDataContext";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getPageDataContextRule = (pageDataContext: PageDataContext): ExtensionUpdaterRules => {
	const filterNames = ["comment", "selectionMenu", "link", "file", "diff"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { pageDataContext },
	};
};

export default getPageDataContextRule;
