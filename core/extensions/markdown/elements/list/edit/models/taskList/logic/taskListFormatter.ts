import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const taskList: NodeSerializerSpec = async (state, node) => {
	await state.renderList(
		node,
		() => "   ",
		() => "* ",
	);
};

export default taskList;
