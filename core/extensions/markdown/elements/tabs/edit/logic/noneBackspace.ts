import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";

const noneBackspace = (nodeName: string) => {
	return ({ editor }: { editor: Editor }) => {
		const { state } = editor;
		const { node, position } = getFocusNode(state, (node) => node.type.name === nodeName);

		if (!state.selection.empty || !node) return false;

		if (node.childCount <= 1 && !node.textContent) {
			return editor.commands.focus(position + 1);
		}

		return false;
	};
};

export default noneBackspace;
