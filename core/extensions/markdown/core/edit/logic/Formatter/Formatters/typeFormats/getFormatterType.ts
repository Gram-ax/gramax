import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import LegacyFormatter from "./LegacyFormatter";
import XmlFormatter from "./XmlFormatter";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

type NodeFormatterKeys = "table" | "tableRow" | "tableCell";

export interface FormatterType {
	nodeFormatters: Record<NodeFormatterKeys, NodeSerializerSpec>;
	openTag(tagName: string, attributes?: Record<string, any>, selfClosing?: boolean): string;
	closeTag(tagName: string): string;
}

const formatters: Record<Syntax, FormatterType> = {
	legacy: LegacyFormatter,
	xml: XmlFormatter,
};

const getFormatterType = (context: ParserContext) => {
	const syntax: Syntax = context?.getProp("syntax");
	const formatter = formatters[syntax];
	return formatter ?? LegacyFormatter;
};

export default getFormatterType;
