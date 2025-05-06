import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableHeaderRowSimple: NodeSerializerSpec = async (state, node) => {
	await state.renderContent(node);
	state.write("|\n" + state.delim + "|-".repeat(node.childCount) + "|\n");
};

export default tableHeaderRowSimple;
