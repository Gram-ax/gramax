import { Fragment, Node } from "@tiptap/pm/model";
import { EditorState, TextSelection, Transaction } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";

const getExistedAttrs = (node: Node): Array<number> => {
	if (node.type.name !== "tabs" || node.attrs.childAttrs.length === node.childCount) return;
	return node.attrs.childAttrs.filter((attr) => attr.idx === node.maybeChild(attr.idx)?.attrs?.idx);
};

const getRemovedIdx = (node: Node, attrs: Array<number>) => {
	return node.attrs.childAttrs.find((attr) => !attrs.includes(attr))?.idx;
};

const getInsertPosition = (nodePos: number, removedIdx: number, child: Fragment): number => {
	let pos = nodePos + 1;
	child.forEach((node) => {
		if (node.attrs.idx < removedIdx) pos += node.nodeSize;
	});
	return pos;
};

const checkTabContent = (transactions: readonly Transaction[], newState: EditorState): Transaction => {
	let newTr = null;

	transactions.forEach((transaction) => {
		if (!transaction.docChanged) return;
		transaction.steps.forEach((step) => {
			if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
				const { from, to } = step;

				if (transaction.doc && transaction.doc.content) {
					const docSize = transaction.doc.content.size;
					const oldFrom = Math.max(Math.min(from ?? from, docSize), 0);
					const oldTo = Math.max(Math.min(to ?? to, docSize), 0);

					transaction.doc.content.nodesBetween(oldFrom, oldTo, (node, pos) => {
						const attrs = getExistedAttrs(node);
						if (!attrs) return;

						newTr = newState.tr;
						const schema = newState.schema;
						const removedIdx = getRemovedIdx(node, attrs);
						const insertPos = getInsertPosition(pos, removedIdx, node.content);

						newTr.insert(
							insertPos,
							schema.nodes.tab.create(
								{ ...node.attrs.childAttrs[removedIdx] },
								schema.nodes.paragraph.create(),
							),
						);

						newTr.setSelection(TextSelection.create(newTr.doc, insertPos));
					});
				}
			}
		});
	});

	return newTr;
};

export default checkTabContent;
