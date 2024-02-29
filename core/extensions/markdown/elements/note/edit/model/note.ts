import note from "@ext/markdown/elements/note/edit/model/noteSchema";
import { stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditNote from "../components/Note";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		note: {
			setNote: () => ReturnType;
			toggleNote: () => ReturnType;
			updateNote: (attrs: { type: NoteType; title: string }) => ReturnType;
		};
	}
}

const Note = Node.create({
	...getExtensionOptions({ schema: note, name: "note" }),

	parseHTML() {
		return [{ tag: "note-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["note-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditNote);
	},

	addCommands() {
		return {
			setNote:
				() =>
				({ commands, state }) => {
					const attrs = { type: NoteType.note, title: "" };
					const text = getSelectedText(state);
					if (text) return commands.wrapIn(this.name, attrs);
					return commands.insertContent({
						attrs,
						type: this.name,
						content: [{ type: "paragraph", content: [] }],
					});
				},
			toggleNote:
				() =>
				({ commands, editor }) => {
					if (stopExecution(editor, "note")) return false;

					return commands.toggleWrap(this.name);
				},
			updateNote:
				({ type, title }: { type: NoteType; title: string }) =>
				({ commands }) => {
					return commands.updateAttributes(this.type, { type, title });
				},
		};
	},
});

export default Note;
