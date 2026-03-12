import { editName } from "@ext/markdown/elements/question/consts";
import QuestionComponent from "@ext/markdown/elements/question/edit/components/QuestionComponent";
import QuestionStateUpdater from "@ext/markdown/elements/question/edit/logic/questionStateUpdater";
import questionSchema from "@ext/markdown/elements/question/edit/models/questionSchema";
import type { QuestionType } from "@ext/markdown/elements/question/types";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { setQuestion } from "../logic/commands/setQuestion";
import { setQuestionRequired } from "../logic/commands/setQuestionRequired";
import { setQuestionType } from "../logic/commands/setQuestionType";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		question: {
			setQuestion: ({ options }: { options: { type: QuestionType } }) => ReturnType;
			setQuestionType: (type: QuestionType) => ReturnType;
			setQuestionRequired: (required: boolean) => ReturnType;
		};
	}
}

const Question = Node.create({
	...getExtensionOptions({ schema: questionSchema, name: editName }),

	parseHTML() {
		return [{ tag: "question-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["question-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(QuestionComponent);
	},

	addCommands() {
		return {
			setQuestion,
			setQuestionType,
			setQuestionRequired,
		};
	},

	addProseMirrorPlugins() {
		return [QuestionStateUpdater.bind(this)()];
	},
});

export default Question;
