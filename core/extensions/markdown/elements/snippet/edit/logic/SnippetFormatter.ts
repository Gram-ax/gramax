import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const SnippetFormatter: NodeSerializerSpec = (state, node) => {
	state.write(`[snippet:${node.attrs.id ?? ""}]`);
	state.closeBlock(node);
};

export default SnippetFormatter;
