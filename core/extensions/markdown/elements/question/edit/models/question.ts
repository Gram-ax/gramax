import generateUniqueID from "@core/utils/generateUniqueID";
import { editName } from "@ext/markdown/elements/question/consts";
import QuestionComponent from "@ext/markdown/elements/question/edit/components/QuestionComponent";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import QuestionStateUpdater from "@ext/markdown/elements/question/edit/logic/questionStateUpdater";
import questionSchema from "@ext/markdown/elements/question/edit/models/questionSchema";
import { QuestionType } from "@ext/markdown/elements/question/types";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		question: { setQuestion: ({ options }: { options: { type: QuestionType } }) => ReturnType };
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
			setQuestion:
				({ options }) =>
				({ commands, editor }) => {
					const questionId = generateUniqueID();
					const paragraph = editor.schema.nodes.paragraph.create();
					const questionAnswer = editor.schema.nodes.questionAnswer.create(
						{
							answerId: generateUniqueID(),
							questionId,
							type: answerTypeByQuestionType[options?.type || "one"],
						},
						[paragraph.copy()],
					);

					const node = editor.schema.nodes[this.name]?.create({ id: questionId, ...options }, [
						paragraph,
						questionAnswer,
					]);

					return commands.insertContent(node);
				},
		};
	},

	addProseMirrorPlugins() {
		return [QuestionStateUpdater.bind(this)()];
	},
});

export default Question;
