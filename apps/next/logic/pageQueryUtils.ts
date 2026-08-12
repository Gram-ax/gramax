import type Query from "@core/Api/Query";
import Localizer from "@ext/localization/core/Localizer";

export const getNodeQuery = (query: Record<string, string | string[] | undefined>, articlePath?: string): Query => {
	const nodeQuery: Query = {};

	for (const [key, value] of Object.entries(query)) {
		if (value == null) continue;
		nodeQuery[key] = Array.isArray(value) ? value.join("/") : value;
	}

	nodeQuery.l = Localizer.extract(articlePath);
	return nodeQuery;
};
