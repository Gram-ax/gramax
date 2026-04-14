import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import type { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableRowFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(`${XmlFormatter.openTag("tr")}\n`);
	await state.renderContent(node);
	state.write(`${XmlFormatter.closeTag("tr")}\n`);
};

export default tableRowFormatter;
