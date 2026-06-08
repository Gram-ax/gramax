import { createDataValue } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import type { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { getTableAttrs } from "@ext/markdown/elements/table/edit/logic/formatters/xml/tableFormatter";

const tableFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(`{% table${createDataValue(getTableAttrs(node.attrs))} %}\n\n`);
	await state.renderContent(node);
	state.write(`{% /table %}\n`);
};

export default tableFormatter;
