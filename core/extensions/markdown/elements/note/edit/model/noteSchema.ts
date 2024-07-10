import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const note = {
	group: "block",
	content: "block+",
	defining: true,
	attrs: {
		title: { default: null },
		type: { default: NoteType.note },
		collapsed: { default: false },
	},
};

export default note;
