import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const paragraphFormatter: NodeSerializerSpec = async (state, node) => {
	if (node.content?.size) await state.renderInline(node);
	else state.write("\n");
	state.closeBlock(node);
};

export default paragraphFormatter;
