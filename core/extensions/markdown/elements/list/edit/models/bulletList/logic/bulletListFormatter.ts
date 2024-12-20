import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const bulletList: NodeSerializerSpec = async (state, node) => {
	await state.renderList(
		node,
		() => "   ",
		() => (node.attrs.bullet || "-") + "  ",
	);
};

export default bulletList;
