import cssEscape from "css.escape";
import { fromJS } from "immutable";
import { opId } from "swagger-client/es/helpers";

const escapeDeepLinkPath = (str) => {
	const deepLinkPath = typeof str === "string" || str instanceof String ? str.trim().replace(/\s/g, "%20") : "";
	const escapedDeepLinkPath = deepLinkPath.replace(/%20/g, "_");
	return cssEscape(escapedDeepLinkPath);
};

// https://github.com/swagger-api/swagger-ui/blob/dcb493cdbf58fa885047513bd176a644f92c4955/src/core/config/defaults.js#L56
const allowedMethods = ["get", "post", "put", "patch", "delete", "head", "options", "trace"];

const createTagId = (name: string) => ["operations-tag", name].map(escapeDeepLinkPath).join("-");
const createOperationId = (tagName: string, operationId: string) =>
	escapeDeepLinkPath(["operations", tagName, operationId].join("-"));

export interface OpenApiNavigation {
	id: string;
	name: string;
	title: string;
	child: { id: string; title: string }[];
}

const buildNavigationFromSpec = (specObject) => {
	const navigation: OpenApiNavigation[] = [];
	const tags = specObject.tags;
	if (tags && Array.isArray(tags))
		tags.forEach((tag) => {
			const name = tag.name;

			if (!name) return;

			const idName = typeof name === "string" ? name : fromJS(name);
			const id = createTagId(idName);
			navigation.push({
				id,
				name: typeof name === "string" ? name : fromJS(name).toString(),
				child: [],
				title: typeof name === "string" ? name : "",
			});
		});

	const paths = specObject.paths;
	if (!paths) return navigation;

	for (const [path, pathItem] of Object.entries(specObject.paths || {})) {
		for (const [method, operation] of Object.entries(pathItem || {})) {
			const lowerMethod = method.toLowerCase().trim();
			if (!allowedMethods.includes(lowerMethod)) {
				continue;
			}
			const operationId =
				operation.__originalOperationId || operation.operationId || opId(operation, path, method);

			const currentTags =
				Array.isArray(operation.tags) && operation.tags.length > 0 ? operation.tags : ["default"];

			currentTags.forEach((tag) => {
				const tagName = typeof tag === "string" ? tag : fromJS(tag).toString();

				const getCurrentTag = (): OpenApiNavigation => {
					const tagFromResult = navigation.find((r) => r.name === tagName);
					if (tagFromResult) return tagFromResult;

					const id = createTagId(tag);
					const newTag = {
						id,
						name: typeof tagName === "string" ? tagName : fromJS(tagName).toString(),
						child: [],
						title: typeof name === "string" ? name : "",
					};
					navigation.push(newTag);
					return newTag;
				};
				const currentTag = getCurrentTag();

				const title = operation.summary ? operation.summary : path;
				const id = createOperationId(typeof tag === "string" ? tag : fromJS(tag), operationId);
				currentTag.child.push({ id, title });
			});
		}
	}
	return navigation;
};

export default buildNavigationFromSpec;
