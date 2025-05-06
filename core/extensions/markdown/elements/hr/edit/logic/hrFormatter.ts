import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const hrFormatter: NodeSerializerSpec = (state, node) => {
	state.write(node.attrs.markup || "---");
	state.closeBlock(node);
};

export default hrFormatter;
