import isTemplateEditableBlock from "@ext/markdown/elements/controllers/helpers/isTemplateEditableBlock";
import { editName as BLOCK_FIELD_NAME } from "@ext/markdown/elements/blockContentField/consts";
import { editName as BLOCK_PROPERTY } from "@ext/markdown/elements/blockProperty/consts";
import { ReplaceStep, Step } from "@tiptap/pm/transform";
import { TextSelection, Transaction } from "prosemirror-state";
import { Node } from "@tiptap/pm/model";

const stepsContentHasntBlockField = (transaction: Transaction): boolean => {
	return transaction.steps.some((step) => {
		if (!(step instanceof ReplaceStep)) return false;

		for (const content of step.slice.content.content) {
			if (content.type.name === BLOCK_FIELD_NAME || content.type.name === BLOCK_PROPERTY) return true;
		}
	});
};

const isChangeInBlockField = (doc: Node, steps: Step[]): boolean => {
	for (const step of steps) {
		if (!(step instanceof ReplaceStep)) continue;

		const mapResult = step.getMap().mapResult(step.from);
		const isDeleted = mapResult.deleted;
		const isEditableBlock = isTemplateEditableBlock(
			TextSelection.create(doc, Math.max(0, Math.min(mapResult.pos, doc.content.size))),
		);

		if (isDeleted && isEditableBlock) return true;
	}
};

const selectionRule = (transaction: Transaction): boolean => {
	const doc = transaction.doc;
	const selection = transaction.selection;
	const titleNode = doc.firstChild;

	const isInTitle = selection.from >= 0 && selection.to <= titleNode.nodeSize;
	if (isInTitle) {
		return true;
	}

	if (stepsContentHasntBlockField(transaction)) return false;
	if (isChangeInBlockField(doc, transaction.steps) || isTemplateEditableBlock(selection)) return true;
	if (transaction.docChanged) return false;

	return true;
};

export default selectionRule;
