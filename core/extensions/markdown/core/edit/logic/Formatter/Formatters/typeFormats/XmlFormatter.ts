import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import noteFormatter from "@ext/markdown/elements/note/edit/logic/xml/noteFormatter";
import tableCellFormatter from "@ext/markdown/elements/table/edit/logic/formatters/xml/tableCellFormatter";
import tableFormatter from "@ext/markdown/elements/table/edit/logic/formatters/xml/tableFormatter";
import tableRowFormatter from "@ext/markdown/elements/table/edit/logic/formatters/xml/tableRowFormatter";
import screenSymbols from "@ext/markdown/logic/screenSymbols";

const angleTag = { OPEN: "<", CLOSE: ">", SELF_CLOSE: "/>" };

export function createDataValue(attrs: Record<string, any>) {
	if (!attrs) return "";
	return Object.entries(attrs)
		.filter(([, value]) => value)
		.map(([key, value]) => ` ${key}="${screenSymbols(value)}"`)
		.join("");
}

const XmlFormatter: FormatterType = {
	nodeFormatters: {
		note: noteFormatter,
		table: tableFormatter,
		tableRow: tableRowFormatter,
		tableCell: tableCellFormatter,
	},
	openTag: (tagName: string, attributes?: Record<string, any>, selfClosing?: boolean) => {
		const attrsStr = createDataValue(attributes);
		return `${angleTag.OPEN}${tagName}${attrsStr}${selfClosing ? angleTag.SELF_CLOSE : angleTag.CLOSE}`;
	},

	closeTag: (tagName: string) => {
		return `${angleTag.OPEN}/${tagName}${angleTag.CLOSE}`;
	},
	supportedElements: [
		"snippet",
		"tabs",
		"HTML",
		"view",
		"drawio",
		"mermaid",
		"plant-uml",
		"openApi",
		"video",
		"icon",
		"comment",
	],
};

export default XmlFormatter;
