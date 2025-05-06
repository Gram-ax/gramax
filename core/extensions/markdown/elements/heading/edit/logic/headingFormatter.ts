import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const headingFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(state.repeat("#", node.attrs.level) + " ");
	await state.renderInline(node);
	if (node.attrs.isCustomId) state.write(` {#${node.attrs.id}}`);
	state.closeBlock(node);
};

export default headingFormatter;
