import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const list_item: NodeSerializerSpec = async (state, node) => {
	await state.renderInline(node);
};

export default list_item;
