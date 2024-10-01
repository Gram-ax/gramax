import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getApiUrlCreatorRule = (apiUrlCreator: ApiUrlCreator): ExtensionUpdaterRules => {
	const filterNames = ["link", "file", "comment", "selectionMenu", "copyArticles", "copyMsO"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { apiUrlCreator },
	};
};

export default getApiUrlCreatorRule;
