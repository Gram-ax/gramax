import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import noteFormatter from "@ext/markdown/elements/note/edit/logic/xml/noteFormatter";
import tableCellFormatter from "@ext/markdown/elements/table/edit/logic/formatters/xml/tableCellFormatter";
import tableFormatter from "@ext/markdown/elements/table/edit/logic/formatters/xml/tableFormatter";
import tableRowFormatter from "@ext/markdown/elements/table/edit/logic/formatters/xml/tableRowFormatter";
import screenSymbols from "@ext/markdown/logic/screenSymbols";

type expextedValueType = string | string[];
const angleTag = { OPEN: "<", CLOSE: ">", SELF_CLOSE: "/>" };

const processValue = (value: expextedValueType) => {
	return screenSymbols(Array.isArray(value) ? JSON.stringify(value) : value);
};

export function createDataValue(attrs: Record<string, expextedValueType>) {
	if (!attrs) return "";
	return Object.entries(attrs)
		.filter(([, value]) => value)
		.map(([key, value]) => ` ${key}="${processValue(value)}"`)
		.join("");
}

const XmlFormatter: FormatterType = {
	nodeFormatters: {
		note: noteFormatter,
		table: tableFormatter,
		tableRow: tableRowFormatter,
		tableCell: tableCellFormatter,
	},
	openTag: (tagName: string, attributes?: Record<string, expextedValueType>, selfClosing?: boolean) => {
		const attrsStr = createDataValue(attributes);
		return `${angleTag.OPEN}${tagName}${attrsStr}${selfClosing ? angleTag.SELF_CLOSE : angleTag.CLOSE}`;
	},

	closeTag: (tagName: string) => {
		return `${angleTag.OPEN}/${tagName}${angleTag.CLOSE}`;
	},
	supportedElements: [
		"fragment",
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
