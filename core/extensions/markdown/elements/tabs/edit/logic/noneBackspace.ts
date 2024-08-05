import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";

const noneBackspace = (nodeName: string) => {
	return ({ editor }: { editor: Editor }) => {
		const { state } = editor;
		const { node: tab, position: tabPosition } = getFocusNode(state, (node) => node.type.name === nodeName);

		if (!tab) return false;

		if (!state.selection.empty) return false;

		if (tab.childCount <= 1 && !tab.textContent) {
			return editor.commands.focus(tabPosition + 1);
		}

		return false;
	};
};

export default noneBackspace;
