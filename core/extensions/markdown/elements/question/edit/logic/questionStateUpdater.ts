import { editName as questionEditName } from "@ext/markdown/elements/question/consts";
import { Editor, findParentNode } from "@tiptap/core";
import { MarkType } from "@tiptap/pm/model";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
import { AttrStep } from "@tiptap/pm/transform";

export default function QuestionStateUpdater(this: { name: string; editor: Editor; type: MarkType }) {
	const updateQuestionState = (tr: Transaction, state: EditorState) => {
		if (!tr.docChanged) return null;
		let newTr = null;

		tr.steps.forEach((step) => {
			if (step instanceof AttrStep && step.attr === "correct") {
				const node = tr.doc.nodeAt(step.pos);
				const oldNode = tr.before.nodeAt(step.pos);
				const nodeId = node.attrs.answerId || node.attrs.id;
				if (!nodeId) return;

				const oldValue = oldNode?.attrs[step.attr];
				const newValue = node.attrs[step.attr];

				if (oldValue === newValue) return;

				const questionData = findParentNode((node) => node.type.name === questionEditName)(state.selection);
				if (!questionData || questionData.node.attrs.id !== node.attrs.questionId) return;

				const questionNode = questionData.node;
				if (questionNode.attrs.type !== "one") return;

				questionNode.content.forEach((answerNode, offset) => {
					if (answerNode.attrs.answerId !== nodeId && answerNode.attrs.correct) {
						newTr = newTr || state.tr;
						newTr = newTr.setNodeAttribute(questionData.start + offset, "correct", false);
					}
				});
			}
		});

		return newTr;
	};

	return new Plugin({
		key: new PluginKey("questionStateUpdater$"),
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		appendTransaction(transactions, _, newState) {
			let newTr = null;
			transactions.forEach((tr) => (newTr = updateQuestionState(tr, newState)));
			return newTr;
		},
	});
}
