import { AVAILABLE_LEVELS } from "@ext/markdown/elements/heading/edit/model/heading";
import type { Editor } from "@tiptap/core";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import getUniqueHeadingId from "../logic/getUniqueHeadingId";

const getSelectedHeading = (state: EditorState) => {
	const { $from } = state.selection;

	for (let depth = $from.depth; depth > 0; depth--) {
		const node = $from.node(depth);
		if (node.type.name === "heading") return { node, position: $from.before(depth) };
	}

	return null;
};

class UpdateHeadingId {
	constructor(
		_view: EditorView,
		protected _editor: Editor,
	) {}

	update(view: EditorView, lastState?: EditorState) {
		const state = this._getState(view, lastState);
		if (!state) return;

		const selectedHeading = getSelectedHeading(state);
		if (!selectedHeading || selectedHeading.node.attrs.isCustomId) return;

		const previousHeading = lastState ? getSelectedHeading(lastState) : null;
		if (
			previousHeading?.position === selectedHeading.position &&
			previousHeading.node.textContent === selectedHeading.node.textContent &&
			previousHeading.node.attrs.isCustomId === selectedHeading.node.attrs.isCustomId
		) {
			return;
		}

		const domAtCursor = view.domAtPos(state.selection.anchor, -1).node;
		const elementAtCursor = domAtCursor instanceof HTMLElement ? domAtCursor : domAtCursor.parentElement;
		const heading = elementAtCursor?.closest<HTMLElement>(AVAILABLE_LEVELS.map((level) => `h${level}`).join(","));
		if (!heading) return;

		const id = getUniqueHeadingId(heading, selectedHeading.node.textContent);
		if (selectedHeading.node.attrs.id !== id)
			this._editor.commands.updateAttributes(selectedHeading.node.type, { id });
	}

	protected _getState(view: EditorView, lastState?: EditorState): EditorState {
		const state = view.state;
		if (!this._stateIsUpdated(state, lastState)) return null;
		return state;
	}

	private _stateIsUpdated(state: EditorState, lastState?: EditorState) {
		return !lastState?.doc.eq(state.doc);
	}
}

export default UpdateHeadingId;
