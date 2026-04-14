import type Theme from "../../../../../Theme/Theme";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getThemeRule = (theme: Theme): ExtensionUpdaterRules => {
	const filterNames = ["comment"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { theme },
	};
};

export default getThemeRule;
