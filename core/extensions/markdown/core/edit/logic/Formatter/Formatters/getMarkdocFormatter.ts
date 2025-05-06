import { Markdown, Schema, SchemaType, Tag } from "../../../../render/logic/Markdoc";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import getFormatterType from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";

export function getMarkdocFormatter(schema: Schema, context: ParserContext) {
	if (schema.render == "Formula") {
		return (tag: Tag): string => {
			return tag.attributes.content;
		};
	}

	const formatter = getFormatterType(context);

	return (tag: Tag, children?: Markdown, onlyClose?: boolean, onlyOpen?: boolean): string => {
		const tagName = tag.name.toLowerCase();
		const closeTag = formatter.closeTag(tagName);
		if (onlyClose) return closeTag;
		const selfClosing = schema.selfClosing ?? true;
		const attrs = schema.attributes
			? Object.keys(schema.attributes).reduce((acc, attr) => {
					acc[attr] = tag.attributes[attr] || "";
					return acc;
			  }, {} as Record<string, any>)
			: {};
		const openTag = formatter.openTag(tagName, attrs, selfClosing);
		if (onlyOpen) return openTag;
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
