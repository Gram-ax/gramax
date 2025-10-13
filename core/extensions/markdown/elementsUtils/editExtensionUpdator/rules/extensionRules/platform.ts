import { Environment } from "@app/resolveModule/env";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getPlatformRule = (platform: Environment): ExtensionUpdaterRules => {
	const filterNames = ["file"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { platform },
	};
};

export default getPlatformRule;
