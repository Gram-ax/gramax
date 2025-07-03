import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const blockMdFormatter: NodeSerializerSpec = (state, node) => {
	state.text(node.attrs.text, false);
	state.closeBlock(node);
};

export default blockMdFormatter;
