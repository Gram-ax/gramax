import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableCellFormatter: NodeSerializerSpec = async (state, node) => {
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
};

export default tableCellFormatter;
