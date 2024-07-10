import NoteAttrs from "@ext/markdown/elements/note/edit/model/NoteAtrrs";
import note from "@ext/markdown/elements/note/edit/model/noteSchema";
import { stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditNote from "../components/Note";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		note: {
			setNote: () => ReturnType;
			toggleNote: () => ReturnType;
			updateNote: (attrs: NoteAttrs) => ReturnType;
		};
	}
}

const inputRegex = /^\s*>\s$/;

const Note = Node.create({
	...getExtensionOptions({ schema: note, name: "note" }),

	parseHTML() {
		return [{ tag: "note-react-component" }, { tag: "blockquote", attrs: { type: NoteType.quote } }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["note-react-component", mergeAttributes(HTMLAttributes), 0];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditNote);
	},

	addInputRules() {
		return [
			wrappingInputRule({
				find: inputRegex,
				type: this.type,
				joinPredicate: () => false,
				keepAttributes: true,
				getAttributes: {
					type: NoteType.quote,
				},
			}),
		];
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
				(props: NoteAttrs) =>
				({ commands }) => {
					return commands.updateAttributes(this.type, props);
				},
		};
	},
});

export default Note;
