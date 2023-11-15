import { Markdown, Schema, SchemaType, Tag } from "../../../../render/logic/Markdoc";

function createDataValue(attributes) {
	return Object.values(attributes)
		.filter((v) => v)
		.join(":");
}

export function getSquareFormatter(schema: Schema) {
	if (schema.render == "Formula") {
		return (tag: Tag): string => {
			return tag.attributes.content;
		};
	}

	return (tag: Tag, children: Markdown, onlyClose?: boolean, onlyOpen?: boolean): string => {
		const tagName = tag.name.toLowerCase();
		const closeTag = `[/${tagName}]`;
		if (onlyClose) return closeTag;
		const colonIsExist = tag.attributes.datavalue
			? ":"
			: tag.attributes.datavalue ?? (Object.keys(tag.attributes).length == 0 ? "" : ":");
		const openTag = `[${tagName}${colonIsExist}${tag.attributes?.datavalue ?? createDataValue(tag.attributes)}]`;
		if (onlyOpen) return openTag;
		const selfClosing = schema?.selfClosing ?? true;
		if (!selfClosing) return `${openTag}${children}${getPrefix(schema, tag, true)}${closeTag}`;
		return openTag;
	};
}

export function getPrefix(schema: Schema, tag: Tag, isSelfClosing = false): string {
	const blockPrefix = isSelfClosing ? "\n" : "\n\n";
	const inlinePrefix = "";
	if (!schema?.type) return inlinePrefix;
	if (schema.type == SchemaType.block) return blockPrefix;
	if (schema.type == SchemaType.inline) return inlinePrefix;
	if (schema.type == SchemaType.variable) return tag.attributes.isInline ? inlinePrefix : blockPrefix;
}
