import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getApiUrlCreatorRule = (apiUrlCreator: ApiUrlCreator): ExtensionUpdaterRules => {
	const filterNames = ["link", "file", "comment", "selectionMenu", "image"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { apiUrlCreator },
	};
};

export default getApiUrlCreatorRule;
