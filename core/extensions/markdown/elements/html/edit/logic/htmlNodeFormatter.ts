import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const htmlNodeFormatter: NodeSerializerSpec = (state, node) => {
	state.write(`[html]\n\n`);
	state.write(node.attrs.content);
	state.write(`\n\n[/html]`);
	state.closeBlock(node);
};

export default htmlNodeFormatter;
