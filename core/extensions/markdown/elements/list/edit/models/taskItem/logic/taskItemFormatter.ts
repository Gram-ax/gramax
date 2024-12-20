import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const taskItem: NodeSerializerSpec = async (state, node) => {
	const { attrs } = node;
	const checked = attrs?.checked;

	state.write(`[${checked ? "x" : " "}] `);
	await state.renderInline(node);
};

export default taskItem;
