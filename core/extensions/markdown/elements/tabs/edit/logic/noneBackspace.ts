import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

const noneBackspace = (nodeName: string) => {
	return ({ editor }: { editor: Editor }) => {
		const { state } = editor;
		const { node: tab, position: tabPosition } = getFocusNode(state, (node) => node.type.name === nodeName);

		if (!tab) return false;

		const { node: curNode } = getFocusNode(
			state,
			(node) => node.type.name !== nodeName && node.type.name !== "tabs",
			false,
		);
		const anchor = state.selection.$anchor;

		if (anchor.pos === ((curNode.isTextblock && tabPosition + 2) || tabPosition + 1)) {
			if (curNode.isBlock && !curNode.isInline && tab.childCount === 1 && curNode.type.name !== "paragraph") {
				editor
					.chain()
					.focus()
					.command(({ tr, dispatch }) => {
						const from = tabPosition + 1;
						const to = tabPosition + curNode.nodeSize + 1;

						tr.replaceRangeWith(from, to, editor.schema.nodes.paragraph.create());

						tr.setSelection(TextSelection.create(tr.doc, from + 1));

						dispatch(tr);
						return true;
					})
					.run();
			}

			return true;
		}

		if (!state.selection.empty) return false;

		if (tab.childCount <= 1 && !tab.textContent) {
			return editor.commands.focus(tabPosition + 1);
		}

		return false;
	};
};

export default noneBackspace;
