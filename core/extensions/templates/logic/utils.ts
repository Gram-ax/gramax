import { Property, PropertyValue } from "@ext/properties/models";
import { TemplateField } from "@ext/templates/models/types";
import { JSONContent } from "@tiptap/core";

export const recursiveFindNode = (node: JSONContent, type: string): JSONContent[] => {
	const nodes: JSONContent[] = node.type === type ? [node] : [];

	if (!node.content) {
		return nodes;
	}

	return node.content.reduce((acc, child) => acc.concat(recursiveFindNode(child, type)), nodes);
};

export const combineCustomProperties = (
	customProperties: Property[],
	catalogProperties: Map<string, Property>,
): Map<string, Property> => {
	const resultMap = new Map(catalogProperties);
	customProperties.forEach((prop) => {
		resultMap.set(prop.name, prop);
	});
	return resultMap;
};

export const fillMarkdownTemplate = (fields: TemplateField[], properties: PropertyValue[], content: string): string => {
	let updatedContent = content;

	if (fields) {
		updatedContent = fields.reduce((acc, field) => {
			const blockRegex = new RegExp(
				`\\[block-field:${field.name}:([^\\]]*?)\\]([\\s\\S]*?)\\[\\/block-field\\]`,
				"g",
			);

			return acc.replace(
				blockRegex,
				(_, placeholder) => `[block-field:${field.name}:${placeholder}]\n${field.value}\n[/block-field]`,
			);
		}, updatedContent);
	}

	if (properties) {
		updatedContent = properties.reduce((acc, propValue) => {
			if (!propValue.value || !propValue.value.length) {
				return acc;
			}

			const blockRegex = new RegExp(
				`\\[block-property:${propValue.name}\\]([\\s\\S]*?)\\[\\/block-property\\]`,
				"g",
			);

			return acc.replace(
				blockRegex,
				() => `[block-property:${propValue.name}]\n${propValue.value[0]}\n[/block-property]`,
			);
		}, updatedContent);
	}

	return updatedContent;
};
