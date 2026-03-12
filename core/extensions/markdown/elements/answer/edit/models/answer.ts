import { editName } from "@ext/markdown/elements/answer/consts";
import AnswerComponent from "@ext/markdown/elements/answer/edit/components/AnswerComponent";
import answerSchema from "@ext/markdown/elements/answer/edit/models/answerSchema";
import type { QuizCorrect } from "@ext/markdown/elements/question/types";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { addQuestionAnswer } from "../logic/commands/addQuestionAnswer";
import { setQuestionAnswerCorrect } from "../logic/commands/setQuestionAnswerCorrect";
import { handleBackspace } from "../logic/keymaps/handleBackspace";
import { handleEnter } from "../logic/keymaps/handleEnter";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		questionAnswer: {
			addQuestionAnswer: (attrs?: { correct?: QuizCorrect }) => ReturnType;
			setQuestionAnswerCorrect: (correct: QuizCorrect) => ReturnType;
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
			addQuestionAnswer,
			setQuestionAnswerCorrect,
		};
	},

	addKeyboardShortcuts() {
		return {
			Enter: handleEnter,
			Backspace: handleBackspace,
		};
	},
});

export default QuestionAnswer;
