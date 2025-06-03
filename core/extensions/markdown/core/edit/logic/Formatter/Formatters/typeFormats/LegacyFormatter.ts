import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import noteFormatter from "@ext/markdown/elements/note/edit/logic/legacy/noteFormatter";
import tableCellFormatter from "@ext/markdown/elements/table/edit/logic/formatters/legacy/tableCellFormatter";
import tableFormatter from "@ext/markdown/elements/table/edit/logic/formatters/legacy/tableFormatter";
import tableRowFormatter from "@ext/markdown/elements/table/edit/logic/formatters/legacy/tableRowFormatter";
import screenSymbols from "@ext/markdown/logic/screenSymbols";

const squareTag = { OPEN: "[", CLOSE: "]" };

const LegacyFormatter: FormatterType = {
	nodeFormatters: {
		note: noteFormatter,
		table: tableFormatter,
		tableRow: tableRowFormatter,
		tableCell: tableCellFormatter,
	},
	openTag: (tagName: string, attributes?: Record<string, any>) => {
		const attrsStr = Object.values(attributes || {})
			.map((value) => `:${screenSymbols(value)}`)
			.join("")
			.replace(/:+$/, "");
		return `${squareTag.OPEN}${tagName}${attrsStr}${squareTag.CLOSE}`;
	},
	closeTag: (tagName: string) => {
		return `${squareTag.OPEN}/${tagName}${squareTag.CLOSE}`;
	},
	supportedElements: XmlFormatter.supportedElements,
};

export default LegacyFormatter;
