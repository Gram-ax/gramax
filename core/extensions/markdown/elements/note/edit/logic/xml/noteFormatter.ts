import XmlFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/XmlFormatter";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { Node } from "@tiptap/pm/model";

export const getNoteAttributes = (node: Node) => {
	return {
		type: node.attrs.type !== NoteType.note ? node.attrs.type : "",
		title: node.attrs.title,
		collapsed: node.attrs.collapsed == true ? "true" : "",
	};
};

const noteFormatter: NodeSerializerSpec = async (state, node) => {
	state.write(`${XmlFormatter.openTag("note", getNoteAttributes(node))}\n\n`);
	await state.renderContent(node);
	state.write(XmlFormatter.closeTag("note"));
	state.closeBlock(node);
};

export default noteFormatter;
