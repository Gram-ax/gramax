import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const tableBodyRowSimple: NodeSerializerSpec = async (state, node) => {
	await state.renderContent(node);
	state.write("|\n");
};

export default tableBodyRowSimple;
