import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const listItemFormatter: NodeSerializerSpec = async (state, node) => {
	const { isTaskItem, checked } = node.attrs;

	if (isTaskItem) state.write(`[${checked ? "x" : " "}] `);
	await state.renderInline(node);
};

export default listItemFormatter;
