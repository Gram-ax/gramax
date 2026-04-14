import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getSourceDataRule = (sourceData: SourceData[]): ExtensionUpdaterRules => {
	const filterNames = ["selectionMenu"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { sourceData },
	};
};

export default getSourceDataRule;
