import type { Editor } from "@tiptap/core";

const tabsBackspace = ({ editor }: { editor: Editor }) => {
	const { $from, $to } = editor.view.state.selection;
	if ($from.pos !== $to.pos || $from.parentOffset !== 0) return false;

	const paragraphStart = $from.before();
	if (paragraphStart === 0) return false;

	const parStart = editor.state.doc.resolve(paragraphStart);
	const indexInParent = parStart.index();
	if (indexInParent === 0) return false;

	const nodeBefore = parStart.node().child(indexInParent - 1);
	if (!nodeBefore || nodeBefore.type.name !== "tabs") return false;

	const curParagraph = $from.parent;
	const paragraphEnd = paragraphStart + curParagraph.nodeSize;
	const insertPos = paragraphStart - 2;

	return editor
		.chain()
		.deleteRange({ from: paragraphStart, to: paragraphEnd })
		.insertContentAt(insertPos, curParagraph.content)
		.setTextSelection(insertPos + 1)
		.run();
};

export default tabsBackspace;
