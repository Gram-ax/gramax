import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const bullet_list: NodeSerializerSpec = async (state, node) => {
	await state.renderList(
		node,
		() => "   ",
		() => (node.attrs.bullet || "-") + "  ",
	);
};

export default bullet_list;
