import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror/schema";
import diffItemSchema from "@ext/markdown/elements/diff/edit/model/diffItemSchema";
import astToDiffAst from "@ext/markdown/elements/diff/logic/astToDiffAst";
import getDecoratorsFromDiffNode from "@ext/markdown/elements/diff/logic/getDecoratorsFromDiffNode";
import getDiffNodes from "@ext/markdown/elements/diff/logic/getDiffNodes";
import { AddMarkStep, RemoveMarkStep, Step } from "@tiptap/pm/transform";
import { Editor } from "@tiptap/react";
import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";

const diffSchema = { nodes: { diff_item: diffItemSchema } };
const schema = getSchema(diffSchema);

function filterAddCommentMarkSteps(step: Step) {
	if ((step instanceof AddMarkStep || step instanceof RemoveMarkStep) && step.mark.type.name === "comment")
		return false;
	return true;
}

const showDiffs = (
	oldEditor: Editor,
	newEditor: Editor,
): { oldEditorDecorations: DecorationSet; newEditorDecoration: DecorationSet } => {
	const oldDoc = astToDiffAst(oldEditor.state.doc.toJSON());
	const newDoc = astToDiffAst(newEditor.state.doc.toJSON());

	const oldNode = Node.fromJSON(schema, oldDoc.diffDoc);
	const newNode = Node.fromJSON(schema, newDoc.diffDoc);
	const diffNodes = getDiffNodes(oldNode, oldDoc.paths, newNode, newDoc.paths, filterAddCommentMarkSteps);
	const { addedDecorations, removedDecorations, changedContextDecorations } = getDecoratorsFromDiffNode(
		oldEditor,
		newEditor,
		diffNodes,
	);

	return {
		oldEditorDecorations: DecorationSet.create(oldEditor.state.doc, removedDecorations),
		newEditorDecoration: DecorationSet.create(newEditor.state.doc, [
			...addedDecorations,
			...changedContextDecorations,
		]),
	};
};

export default showDiffs;
