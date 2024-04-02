import { Editor } from "@tiptap/core";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Root, createRoot } from "react-dom/client";

abstract class Base {
	protected _root: Root;
	protected _tooltip: HTMLElement;
	protected _componentIsSet: boolean;
	protected _componentIsShow: boolean;
	protected _lastPosition: number = null;

	constructor(protected _view: EditorView, protected _editor: Editor) {
		this._tooltip = document.createElement("div");
		this._tooltip.style.position = "absolute";
		this._view.dom.parentElement.appendChild(this._tooltip);
		this._root = createRoot(this._tooltip);
	}

	public abstract update(view: EditorView, lastState?: EditorState): void;

	public destroy() {
		this._tooltip.remove();
	}

	protected _removeComponent() {
		if (!this._componentIsSet) return;
		this._componentIsSet = false;
		this._root.render(null);
	}

	protected _setComponent(component: JSX.Element) {
		this._componentIsSet = true;
		this._root.render(component);
	}

	protected _hideComponent() {
		if (!this._componentIsShow) return;
		this._componentIsShow = false;
		this._tooltip.style.opacity = "0";
	}

	protected _showComponent() {
		this._componentIsShow = true;
		this._tooltip.style.opacity = "1";
	}

	protected _getState(view: EditorView, lastState?: EditorState): EditorState {
		const state = view.state;
		this._lastPosition = state.selection.anchor;
		if (!this._stateIsUpdated(state, lastState)) return null;

		return state;
	}

	protected abstract _setTooltipPosition(element: HTMLElement | MouseEvent): void;

	private _stateIsUpdated(state: EditorState, lastState?: EditorState) {
		return !(lastState && lastState.doc.eq(state.doc) && lastState.selection.eq(state.selection));
	}
}

export default Base;
