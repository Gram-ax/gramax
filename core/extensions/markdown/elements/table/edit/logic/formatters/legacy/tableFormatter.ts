import { createDataValue } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(`{% table${createDataValue(node.attrs)} %}\n\n`);
	await state.renderContent(node);
	state.write(`{% /table %}\n`);
};

export default tableFormatter;
