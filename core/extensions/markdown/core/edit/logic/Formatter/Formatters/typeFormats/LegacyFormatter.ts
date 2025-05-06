import { createDataValue } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import TableUtils from "@ext/markdown/core/edit/logic/Formatter/Utils/Table";
import screenSymbols from "@ext/markdown/logic/screenSymbols";

const squareTag = { OPEN: "[", CLOSE: "]" };
const LegacyFormatter: FormatterType = {
	nodeFormatters: {
		table: async (state, node) => {
			state.write(`{% table${createDataValue(node.attrs)} %}\n\n`);
			await state.renderContent(node);
			state.write(`{% /table %}\n`);
		},
		tableRow: async (state, node) => {
			state.write(`---\n\n`);
			await state.renderList(
				node,
				() => "   ",
				() => (node.attrs.bullet || "*") + "  ",
			);
		},
		tableCell: async (state, node) => {
			state.write(TableUtils.getOldCellAttributes(node.attrs));
			await state.renderContent(node);
		},
	},
	openTag: (tagName: string, attributes?: Record<string, any>) => {
		if (tagName === "note")
			return `:::${attributes.type || "note"}${attributes.collapsed ? ":true" : ""} ${attributes.title ?? ""}`;
		const attrsStr = Object.values(attributes || {})
			.map((value) => `:${screenSymbols(value)}`)
			.join("")
			.replace(/:+$/, "");
		return `${squareTag.OPEN}${tagName}${attrsStr}${squareTag.CLOSE}`;
	},
	closeTag: (tagName: string) => {
		if (tagName === "note") return ":::";
		return `${squareTag.OPEN}/${tagName}${squareTag.CLOSE}`;
	},
};

export default LegacyFormatter;
