import GitHubFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/GitHubFormatter";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import ParserContext from "@ext/markdown/core/Parser/ParserContext/ParserContext";
import LegacyFormatter from "./LegacyFormatter";
import XmlFormatter from "./XmlFormatter";

type NodeFormatterKeys = "note" | "table" | "tableRow" | "tableCell";
type SupportedElement =
	| "snippet"
	| "tabs"
	| "HTML"
	| "view"
	| "drawio"
	| "mermaid"
	| "plant-uml"
	| "openApi"
	| "video"
	| "icon"
	| "comment";

export interface FormatterType {
	nodeFormatters: Record<NodeFormatterKeys, NodeSerializerSpec>;
	openTag(tagName: string, attributes?: Record<string, any>, selfClosing?: boolean): string;
	closeTag(tagName: string): string;
	type?: Syntax;
	supportedElements: SupportedElement[];
}

const formatters: Record<Syntax, FormatterType> = {
	"GitHub Flavored Markdown": GitHubFormatter,
	Legacy: LegacyFormatter,
	XML: XmlFormatter,
};

export const getFormatterTypeByContext = (context: ParserContext) => {
	return getFormatterType(context?.getProp("syntax"));
};

const getFormatterType = (syntax: Syntax) => {
	return formatters[syntax?.toUpperCase?.() === Syntax.xml ? Syntax.xml : syntax] ?? LegacyFormatter;
};

export default getFormatterType;
