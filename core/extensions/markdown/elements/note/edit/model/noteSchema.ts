import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const note = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: "noteTitle? block+",
	defining: true,
	attrs: {
		title: { default: null },
		type: { default: NoteType.note },
		collapsed: { default: false },
	},
};

export default note;
