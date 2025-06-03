import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { getNoteAttributes } from "@ext/markdown/elements/note/edit/logic/xml/noteFormatter";

const noteFormatter: NodeSerializerSpec = async (state, node) => {
	const attributes = getNoteAttributes(node);
	state.write(`:::${attributes.type || "note"}${attributes.collapsed ? ":true" : ""} ${attributes.title ?? ""}\n\n`);
	await state.renderContent(node);
	state.write(":::");
	state.closeBlock(node);
};

export default noteFormatter;
