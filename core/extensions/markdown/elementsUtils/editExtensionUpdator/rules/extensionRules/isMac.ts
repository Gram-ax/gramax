import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const isMacInfoRule = (isMac: boolean): ExtensionUpdaterRules => {
	const filterNames = ["selectionMenu"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { isMac: JSON.stringify(isMac) },
	};
};

export default isMacInfoRule;
