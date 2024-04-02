import PageDataContext from "../../../../../../logic/Context/PageDataContext";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getPageDataContextRule = (pageDataContext: PageDataContext): ExtensionUpdaterRules => {
	const filterNames = ["comment", "selectionMenu", "link"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { pageDataContext },
	};
};

export default getPageDataContextRule;
