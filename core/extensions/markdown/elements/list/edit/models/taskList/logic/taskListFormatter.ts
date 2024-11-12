import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const task_list: NodeSerializerSpec = async (state, node) => {
	await state.renderList(
		node,
		() => "   ",
		() => "* ",
	);
};

export default task_list;
