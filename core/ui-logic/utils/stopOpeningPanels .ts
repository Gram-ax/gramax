import { LEFT_NAV_CLASS, RIGHT_NAV_CLASS } from "@app/config/const";
import debounceFunction from "../debounceFunction";
import { EditorView } from "prosemirror-view";

export default (id: symbol, view: EditorView, excludeManySelection: boolean = false) => {
	const isManySelection = view?.state.selection.from !== view?.state.selection.to;
	const panels = [RIGHT_NAV_CLASS, LEFT_NAV_CLASS].map((className) =>
		document.querySelector<HTMLElement>(`.${className}`),
	);

	if (excludeManySelection || isManySelection) panels.map((panel) => (panel.style.pointerEvents = "none"));

	const removeNone = () => {
		panels.map((panel) => panel.style.removeProperty("pointer-events"));
	};

	return debounceFunction(id, removeNone, 500);
};
