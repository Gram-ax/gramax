import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableCellSimple: NodeSerializerSpec = async (state, node) => {
	state.write("|");
	await state.renderInline(node);
};

export default tableCellSimple;
