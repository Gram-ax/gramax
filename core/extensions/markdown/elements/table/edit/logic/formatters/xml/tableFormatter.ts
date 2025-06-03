import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(`${XmlFormatter.openTag("table", { header: node.attrs.header })}\n`);
	const firstRow = node.firstChild.content;
	if (firstRow.content.some((c) => c.attrs.colwidth)) {
		state.write(`${XmlFormatter.openTag("colgroup")}`);
		firstRow.forEach((cell) => {
			for (let i = 0; i < (cell.attrs.colspan as number); i++)
				state.write(`${XmlFormatter.openTag("col", { width: cell.attrs.colwidth?.[i]?.toString() }, true)}`);
		});
		state.write(`${XmlFormatter.closeTag("colgroup")}\n`);
	}
	await state.renderContent(node);
	state.write(`${XmlFormatter.closeTag("table")}\n`);
};

export default tableFormatter;
