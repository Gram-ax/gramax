import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getResourceServiceRule = (resourceService: ResourceServiceType): ExtensionUpdaterRules => {
	const filterNames = ["copyArticles", "GramaxAi"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { resourceService },
	};
};

export default getResourceServiceRule;
