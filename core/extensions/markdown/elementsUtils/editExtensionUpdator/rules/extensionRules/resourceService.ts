import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getResourceServiceRule = (resourceService: ResourceServiceType): ExtensionUpdaterRules => {
	const filterNames = ["copyArticles", "GramaxAi"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { resourceService },
	};
};

export default getResourceServiceRule;
