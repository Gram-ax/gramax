import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import inlineMdLeafText from "../elements/md/logic/inlineMdLeafText";

const leafTextFuncs: ((n: Node) => string)[] = [inlineMdLeafText];

const getSelectedText = (state: EditorState) => {
	const res =
		state.doc.textBetween(state.selection.$from.pos, state.selection.$to.pos, null, (n) => {
			for (const leafTextFunc of leafTextFuncs) {
				const res = leafTextFunc(n);
				if (res) return res;
			}
			return "";
		}) ??
		state.doc.cut(state.selection.from, state.selection.to)?.text ??
		"";
	return res;
};

export default getSelectedText;
