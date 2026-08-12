import { GFMAlerts } from "@ext/markdown/elements/note/edit/logic/github/noteFormatter";
import { NOTE_TITLE_NODE } from "@ext/markdown/elements/note/logic/noteTitleNode";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import type { JSONContent } from "@tiptap/core";
import type NodeTransformerFunc from "../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const injectTitleNode = (node: JSONContent): JSONContent => {
	const title = node.attrs?.title;
	if (typeof title === "string" && title.length > 0 && node.content?.[0]?.type !== NOTE_TITLE_NODE)
		node.content = [{ type: NOTE_TITLE_NODE, content: [{ type: "text", text: title }] }, ...(node.content ?? [])];
	node.attrs = { ...node.attrs, title: "" };
	return node;
};

const noteNodeTransformer: NodeTransformerFunc = (node) => {
	if (node?.type === "blockquote") {
		node.attrs = { title: "", collapsed: false, ...getGFMAttrs(node) };
		node.type = "note";
	} else if (node?.type === "cut" && node.attrs.isInline === false) {
		node.attrs = { title: node.attrs.text, collapsed: true, type: NoteType.hotfixes };
		node.type = "note";
	} else if (node?.type === "note" && node.attrs.type === "none") {
		node.attrs.type = NoteType.note;
	} else if (node?.type !== "note") {
		return;
	}

	return { isSet: true, value: injectTitleNode(node) };
};

const getGFMAttrs = (node: JSONContent): { type: NoteType; title?: string } => {
	let type = NoteType.quote;

	const typeChildren = node.content?.[0];
	if (
		typeChildren &&
		typeChildren.type === "paragraph" &&
		typeChildren.content?.length === 1 &&
		typeChildren.content[0].type === "text" &&
		!typeChildren.content[0].marks
	) {
		const text = typeChildren.content[0].text.toUpperCase();
		const GFMtype = GFMAlerts[text];
		if (GFMtype) {
			node.content = node.content.slice(1);
			type = GFMtype;
		}
	}

	const titleChildren = node.content?.[0];

	if (
		!titleChildren ||
		titleChildren.type !== "heading" ||
		titleChildren.attrs.level !== 3 ||
		!(titleChildren.content?.length === 1) ||
		titleChildren.content[0].type !== "text" ||
		titleChildren.content[0].marks
	)
		return { type };

	node.content = node.content.slice(1);
	const title = titleChildren.content[0].text;

	return { title, type };
};

export default noteNodeTransformer;
