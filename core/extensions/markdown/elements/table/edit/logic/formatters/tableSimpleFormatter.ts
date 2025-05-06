import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableSimpleFormatter: NodeSerializerSpec = async (state, node) => {
	await state.renderContent(node);
	state.closeBlock(node);
};

export default tableSimpleFormatter;
