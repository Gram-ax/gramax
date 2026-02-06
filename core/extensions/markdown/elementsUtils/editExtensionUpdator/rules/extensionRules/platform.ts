import type { Environment } from "@app/resolveModule/env";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getPlatformRule = (platform: Environment): ExtensionUpdaterRules => {
	const filterNames = ["file"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { platform },
	};
};

export default getPlatformRule;
