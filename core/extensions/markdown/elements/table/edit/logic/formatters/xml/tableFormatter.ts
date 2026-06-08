import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import type { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import type { Attrs } from "@tiptap/pm/model";

export const getTableAttrs = (attrs: Attrs) => {
	const sortingOrder = (attrs.sortingOrder as [])?.length > 1 ? (attrs.sortingOrder as []).join(",") : undefined;
	return {
		...attrs,
		sortingOrder,
	};
};

const tableFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(`${XmlFormatter.openTag("table", getTableAttrs(node.attrs))}\n`);
	const firstRow = node.firstChild.content;
	if (firstRow.content.some((c) => c.attrs.colwidth)) {
		state.write(`${XmlFormatter.openTag("colgroup")}`);
		firstRow.forEach((cell) => {
			for (let i = 0; i < (cell.attrs.colspan as number); i++) {
				const colwidth = cell.attrs.colwidth?.[i];
				state.write(`${XmlFormatter.openTag("col", colwidth ? { width: colwidth?.toString() } : {}, true)}`);
			}
		});
		state.write(`${XmlFormatter.closeTag("colgroup")}\n`);
	}
	await state.renderContent(node);
	state.write(`${XmlFormatter.closeTag("table")}\n`);
};

export default tableFormatter;
