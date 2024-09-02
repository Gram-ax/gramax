import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";

const noneBackspace = (nodeName: string) => {
	return ({ editor }: { editor: Editor }) => {
		const { state } = editor;
		const { $from, $to } = state.selection;
		const {
			node: tab,
			position: tabPosition,
			parentNode,
		} = getFocusNode(state, (node) => node.type.name === nodeName);

		if (!tab) return false;

		if ($from.node($from.depth - 1) === parentNode) return false;

		if ($from.pos - 2 === tabPosition && $from.pos == $to.pos) return true;

		if (!state.selection.empty) return false;

		if (tab.childCount <= 1 && !tab.textContent) {
			return editor.commands.focus(tabPosition + 1);
		}

		return false;
	};
};

export default noneBackspace;
