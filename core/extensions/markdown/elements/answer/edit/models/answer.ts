import generateUniqueID from "@core/utils/generateUniqueID";
import { editName } from "@ext/markdown/elements/answer/consts";
import AnswerComponent from "@ext/markdown/elements/answer/edit/components/AnswerComponent";
import answerSchema from "@ext/markdown/elements/answer/edit/models/answerSchema";
import { AnswerType } from "@ext/markdown/elements/answer/types";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { findParentNode, isAtEndOfNode, isAtStartOfNode, mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		questionAnswer: {
			setQuestionAnswer: (
				position: number,
				options: { questionId: string; answerId: string; type: AnswerType },
			) => ReturnType;
		};
	}
}

const QuestionAnswer = Node.create({
	...getExtensionOptions({ schema: answerSchema, name: editName }),

	parseHTML() {
		return [{ tag: "answer-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["answer-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(AnswerComponent);
	},

	addCommands() {
		return {
			setQuestionAnswer:
				(position, options) =>
				({ commands, editor }) => {
					const questionAnswer = editor.schema.nodes.questionAnswer.create(
						{ id: generateUniqueID(), ...options },
						[editor.schema.nodes.paragraph.create()],
					);

					return commands.insertContentAt(position, questionAnswer);
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			Enter: ({ editor }) => {
				const parentNode = findParentNode((node) => node.type.name === editName)(editor.state.selection);
				if (!parentNode) return false;
				if (!isAtEndOfNode(editor.state)) return false;
				if (
					parentNode.node.content.childCount === 1 &&
					parentNode.node.content.firstChild?.type.name === "paragraph" &&
					parentNode.node.textContent.length === 0
				)
					return false;

				return editor.commands.setQuestionAnswer(parentNode.pos + parentNode.node.nodeSize, {
					questionId: parentNode.node.attrs.questionId,
					answerId: generateUniqueID(),
					type: parentNode.node.attrs.type,
				});
			},
			Backspace: ({ editor }) => {
				const parentNode = findParentNode((node) => node.type.name === editName)(editor.state.selection);
				if (!parentNode) return false;
				if (!isAtStartOfNode(editor.state)) return false;
				if (
					parentNode.node.content.childCount !== 1 ||
					(parentNode.node.content.firstChild?.type.name === "paragraph" &&
						parentNode.node.textContent.length !== 0)
				)
					return false;

				return editor
					.chain()
					.deleteRange({
						from: parentNode.pos,
						to: parentNode.pos + parentNode.node.nodeSize,
					})
					.focus(parentNode.pos - 1)
					.run();
			},
		};
	},
});

export default QuestionAnswer;
