import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const blocks = ["Db-diagram", "Db-table", "Snippet"];

const inlineMdComponentFormatter: NodeSerializerSpec = (state, node) => {
	const isBlock = blocks.includes(node.attrs.tag?.[0]?.name);
	if (isBlock) state.closeBlock(node);
	state.write(node.attrs.text);
	if (isBlock) state.closeBlock(node);
};

export default inlineMdComponentFormatter;
