import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const listItemFormatter: NodeSerializerSpec = async (state, node) => {
	await state.renderInline(node);
};

export default listItemFormatter;
