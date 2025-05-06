import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
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
		table: async (state, node) => {
			state.write(`${XmlFormatter.openTag("table", { header: node.attrs.header })}\n`);
			const firstRow = node.firstChild.content;
			if (firstRow.content.some((c) => c.attrs.colwidth)) {
				state.write(`${XmlFormatter.openTag("colgroup")}`);
				firstRow.forEach((cell) => {
					for (let i = 0; i < (cell.attrs.colspan as number); i++)
						state.write(
							`${XmlFormatter.openTag("col", { width: cell.attrs.colwidth?.[i]?.toString() }, true)}`,
						);
				});
				state.write(`${XmlFormatter.closeTag("colgroup")}\n`);
			}
			await state.renderContent(node);
			state.write(`${XmlFormatter.closeTag("table")}\n`);
		},
		tableRow: async (state, node) => {
			state.write(`${XmlFormatter.openTag("tr")}\n`);
			await state.renderContent(node);
			state.write(`${XmlFormatter.closeTag("tr")}\n`);
		},
		tableCell: async (state, node) => {
			state.write(
				`${XmlFormatter.openTag("td", {
					colspan: node.attrs.colspan == 1 ? null : `${node.attrs.colspan}`,
					rowspan: node.attrs.rowspan == 1 ? null : `${node.attrs.rowspan}`,
					align: node.attrs.align,
					aggregation: node.attrs.aggregation,
				})}\n\n`,
			);
			await state.renderContent(node);
			state.write(`${XmlFormatter.closeTag("td")}\n`);
		},
	},
	openTag: (tagName: string, attributes?: Record<string, any>, selfClosing?: boolean) => {
		const attrsStr = createDataValue(attributes);
		return `${angleTag.OPEN}${tagName}${attrsStr}${selfClosing ? angleTag.SELF_CLOSE : angleTag.CLOSE}`;
	},

	closeTag: (tagName: string) => {
		return `${angleTag.OPEN}/${tagName}${angleTag.CLOSE}`;
	},
};

export default XmlFormatter;
