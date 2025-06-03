import { Markdown, Schema, SchemaType, Tag } from "../../../../render/logic/Markdoc";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import getFormatterType, {
	getFormatterTypeByContext,
} from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";

export function getMarkdocFormatter(schema: Schema, context: ParserContext) {
	if (schema.render == "Formula") {
		return (tag: Tag): string => {
			return tag.attributes.content;
		};
	}

	const formatter = getFormatterTypeByContext(context);
	const htmlFormatter = getFormatterType(Syntax.xml);

	return (tag: Tag, children?: Markdown, onlyClose?: boolean, onlyOpen?: boolean): string => {
		const currentFormatter = tag.name == "htmlTag" ? htmlFormatter : formatter;
		const tagName = tag.name.toLowerCase();
		const closeTag = currentFormatter.closeTag(tagName);
		if (onlyClose) return closeTag;
		const selfClosing = schema.selfClosing ?? true;
		const attrs = schema.attributes
			? Object.keys(schema.attributes).reduce((acc, attr) => {
					acc[attr] = tag.attributes[attr] || "";
					return acc;
			  }, {} as Record<string, any>)
			: {};
		const openTag = currentFormatter.openTag(tagName, attrs, selfClosing);
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
