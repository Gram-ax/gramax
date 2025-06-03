import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableRowFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(`---\n\n`);
	await state.renderList(
		node,
		() => "   ",
		() => (node.attrs.bullet || "*") + "  ",
	);
};

export default tableRowFormatter;
