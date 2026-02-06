import { GFMAlerts } from "@ext/markdown/elements/note/edit/logic/github/noteFormatter";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { JSONContent } from "@tiptap/core";
import NodeTransformerFunc from "../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const noteNodeTransformer: NodeTransformerFunc = (node) => {
	if (node && node.type === "blockquote") {
		node.attrs = {
			title: "",
			collapsed: false,
			...getGFMAttrs(node),
		};

		node.type = "note";

		return { isSet: true, value: node };
	}

	if (node && node.type === "cut" && node.attrs.isInline === false) {
		const { text } = node.attrs;

		node.attrs = {
			title: text,
			collapsed: true,
			type: NoteType.hotfixes,
		};

		node.type = "note";

		return { isSet: true, value: node };
	}

	if (node && node.type === "note" && node.attrs.type === "none") {
		node.attrs.type = NoteType.note;
		return { isSet: true, value: node };
	}

	return;
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
