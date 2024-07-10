import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import NodeTransformerFunc from "../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const noteNodeTransformer: NodeTransformerFunc = (node) => {
	if (node && node.type === "blockquote") {
		node.attrs = {
			title: "",
			collapsed: false,
			type: NoteType.quote,
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

export default noteNodeTransformer;
