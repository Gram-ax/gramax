import t from "@ext/localization/locale/translate";
import type { TocItem } from "@ext/navigation/article/logic/createTocItems";
import { operationAnchorId, tagAnchorId } from "@gramax/openapi-viewer/core";

const allowedMethods = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const addUnique = (items: string[], value: unknown) => {
	if (typeof value === "string" && !items.includes(value)) items.push(value);
};

const orderedTagNames = (spec: Record<string, unknown>, encountered: Iterable<string>): string[] => {
	const result: string[] = [];

	if (Array.isArray(spec["x-tagGroups"]))
		for (const group of spec["x-tagGroups"]) {
			if (!isRecord(group) || !Array.isArray(group.tags)) continue;
			for (const tag of group.tags) addUnique(result, tag);
		}

	if (Array.isArray(spec.tags))
		for (const tag of spec.tags) {
			if (isRecord(tag)) addUnique(result, tag.name);
		}

	for (const tag of encountered) addUnique(result, tag);
	return result;
};

const buildNavigationFromSpec = (specObject: unknown): TocItem[] => {
	if (!isRecord(specObject) || !isRecord(specObject.paths)) return [];

	const operationsByTag = new Map<string, TocItem[]>();
	for (const [path, pathItem] of Object.entries(specObject.paths)) {
		if (!isRecord(pathItem)) continue;

		for (const [method, operation] of Object.entries(pathItem)) {
			if (!allowedMethods.includes(method) || !isRecord(operation) || !isRecord(operation.responses)) continue;

			const tag =
				Array.isArray(operation.tags) && typeof operation.tags[0] === "string"
					? operation.tags[0]
					: t("openApi.untaggedGroupLabel");
			const operationId = typeof operation.operationId === "string" ? operation.operationId : "";
			const rendererId = operationId || `${method}-${path}`.replace(/[^\w]+/g, "-");
			const summary = typeof operation.summary === "string" ? operation.summary : "";
			const items = operationsByTag.get(tag) ?? [];

			items.push({
				url: `#${operationAnchorId({ id: rendererId, operationId, method, path })}`,
				title: summary || operationId || path,
				items: [],
			});
			operationsByTag.set(tag, items);
		}
	}

	return orderedTagNames(specObject, operationsByTag.keys()).flatMap((tag) => {
		const items = operationsByTag.get(tag);
		return items ? [{ url: `#${tagAnchorId(tag)}`, title: tag, items }] : [];
	});
};

export default buildNavigationFromSpec;
