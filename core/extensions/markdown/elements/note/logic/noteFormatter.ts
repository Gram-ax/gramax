import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const noteFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(
		`:::${node.attrs.type ?? ""}${node.attrs.collapsed == true ? ":true" : ""} ${node.attrs.title ?? ""}\n\n`,
	);
	await state.renderContent(node);
	state.write(`:::`);
	state.closeBlock(node);
};

export default noteFormatter;
