import NoteAttrs from "@ext/markdown/elements/note/edit/model/NoteAtrrs";
import note from "@ext/markdown/elements/note/edit/model/noteSchema";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { readyToPlace, stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { BlockPlusAndSubNodes, ListGroupAndItem } from "@ext/markdown/logic/insertableNodeGroups";
import { callOrReturn, findParentNode, InputRule, mergeAttributes, Node } from "@tiptap/core";
import { findWrapping } from "@tiptap/pm/transform";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditNote from "../components/Note";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		note: {
			setNote: (type?: NoteType) => ReturnType;
			toggleNote: (type?: NoteType) => ReturnType;
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
			new InputRule({
				find: inputRegex,
				handler: ({ state, range, match }) => {
					if (!readyToPlace(state, this.type.name, [...BlockPlusAndSubNodes, ...ListGroupAndItem]))
						return null;

					const attributes = callOrReturn({ type: NoteType.quote }, undefined, match) || {};
					const tr = state.tr.delete(range.from, range.to);
					const $start = tr.doc.resolve(range.from);
					const blockRange = $start.blockRange();
					const wrapping = blockRange && findWrapping(blockRange, this.type, attributes);

					if (!wrapping) return null;

					tr.wrap(blockRange, wrapping);
					return true;
				},
			}),
		];
	},

	addCommands() {
		return {
			setNote:
				(type?: NoteType) =>
				({ commands, state }) => {
					const attrs = { type: type || NoteType.note, title: "" };
					const text = getSelectedText(state);
					if (text) return commands.wrapIn(this.name, attrs);
					return commands.insertContent({
						attrs,
						type: this.name,
						content: [{ type: "paragraph", content: [] }],
					});
				},
			toggleNote:
				(type?: NoteType) =>
				({ state, chain }) => {
					if (stopExecution(state, this.type.name, [...BlockPlusAndSubNodes, ...ListGroupAndItem]))
						return false;

					const note = findParentNode((node) => node.type.name === this.name)(state.selection);
					if (!state.selection.empty && note?.node) {
						return chain().focus().toggleWrap(this.name);
					}

					if (!note?.node) {
						return chain()
							.focus()
							.toggleWrap(this.name, { type: type || NoteType.note });
					}

					return chain().updateAttributes(this.name, { type: type || NoteType.note });
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
