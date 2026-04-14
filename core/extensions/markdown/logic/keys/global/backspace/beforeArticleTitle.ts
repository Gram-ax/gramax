import type KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";

const beforeArticleTitle: KeyboardRule = ({ editor }) => {
	const { state } = editor;
	const { $anchor, from, to } = state.selection;

	if (from !== to) return false;

	const anchorParent = $anchor.parent;
	if (anchorParent !== state.doc.content.child(1)) return false;
	if (state.doc.childCount !== 2 || !anchorParent.isTextblock) return false;

	const offset = $anchor.parentOffset;

	if (offset) return false;

	if (anchorParent.childCount > 0) {
		let textContent = "";

		anchorParent.content.forEach((node) => {
			textContent += node.textContent;
		});

		const newTextNode = state.schema.text(textContent);

		const secondNodeStartPos = state.doc.firstChild.nodeSize;
		const secondNodeEndPos = secondNodeStartPos + anchorParent.nodeSize;

		return editor
			.chain()
			.deleteRange({ from: secondNodeStartPos, to: secondNodeEndPos })
			.insertContentAt(state.doc.firstChild.nodeSize - 1, newTextNode)
			.focus(state.doc.firstChild.nodeSize - 1 - newTextNode.content.size)
			.run();
	}

	return editor.commands.focus(state.doc.firstChild.nodeSize - 1);
};

export default beforeArticleTitle;
