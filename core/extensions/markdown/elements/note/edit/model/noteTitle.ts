import noteTitle from "@ext/markdown/elements/note/edit/model/noteTitleSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { type Editor, Node } from "@tiptap/core";

const NoteTitle = Node.create({
	...getExtensionOptions({ schema: noteTitle, name: "noteTitle" }),

	parseHTML() {
		return [{ tag: "note-title" }];
	},

	renderHTML() {
		return ["note-title", { class: "note-title" }, 0];
	},

	addKeyboardShortcuts() {
		const name = this.name;
		const moveToBody = ({ editor }: { editor: Editor }) => {
			const { $from, empty } = editor.state.selection;
			if (!empty || $from.parent.type.name !== name) return false;
			return editor.commands.focus($from.after(), { scrollIntoView: false });
		};

		return { Enter: moveToBody, ArrowDown: moveToBody };
	},
});

export default NoteTitle;
