import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const blockMdComponentFormatter: NodeSerializerSpec = (state, node) => {
	state.text(node.textContent, false);
	state.closeBlock(node);
};

export default blockMdComponentFormatter;
