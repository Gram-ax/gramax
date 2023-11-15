import { Editor } from "@tiptap/core";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import getFocusNode from "../../../../elementsUtils/getFocusNode";
import getChildTextId from "../../logic/getChildTextId";

class UpdateHeadingId {
	protected _lastPosition: number = null;

	constructor(
		view: EditorView,
		protected _editor: Editor,
	) {
		this.update(view);
	}

	update(view: EditorView, lastState?: EditorState) {
		const state = this._getState(view, lastState);
		if (!state) return;
		const { node } = getFocusNode(state, (node) => node.type.name == "heading");
		if (node && !node.attrs?.isCustomId)
			this._editor.commands.updateAttributes(node.type, { id: getChildTextId(node.textContent) });
	}

	protected _getState(view: EditorView, lastState?: EditorState): EditorState {
		const state = view.state;
		this._lastPosition = state.selection.anchor;
		if (!this._stateIsUpdated(state, lastState)) return null;
		return state;
	}

	private _stateIsUpdated(state: EditorState, lastState?: EditorState) {
		return !(lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection));
	}
}

export default UpdateHeadingId;
