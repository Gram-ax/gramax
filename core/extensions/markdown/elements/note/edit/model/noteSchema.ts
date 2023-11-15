import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const note = {
	group: "block",
	content: "block+",
	defining: true,
	attrs: {
		type: { default: NoteType.note },
		title: { default: null },
	},
};

export default note;
