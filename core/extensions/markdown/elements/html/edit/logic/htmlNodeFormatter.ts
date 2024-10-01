import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const htmlNodeFormatter: NodeSerializerSpec = (state, node) => {
	state.write(`[html:${node.attrs?.mode ?? "iframe"}]\n\n`);
	state.text(node.attrs.content, false);
	state.write(`\n\n`);
	state.write(`[/html]`);
	state.closeBlock(node);
};

export default htmlNodeFormatter;
