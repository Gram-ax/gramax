import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getSourceDataRule = (sourceData: SourceData[]): ExtensionUpdaterRules => {
	const filterNames = ["selectionMenu"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { sourceData },
	};
};

export default getSourceDataRule;
