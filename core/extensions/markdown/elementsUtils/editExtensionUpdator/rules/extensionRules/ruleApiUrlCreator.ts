import type ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getApiUrlCreatorRule = (apiUrlCreator: ApiUrlCreator): ExtensionUpdaterRules => {
	const filterNames = [
		"link",
		"file",
		"comment",
		"selectionMenu",
		"copyArticles",
		"copyMsO",
		"diff",
		"GramaxAi",
		"ArticleTitleHelpers",
	];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { apiUrlCreator },
	};
};

export default getApiUrlCreatorRule;
