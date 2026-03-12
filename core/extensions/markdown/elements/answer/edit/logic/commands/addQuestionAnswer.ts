import generateUniqueID from "@core/utils/generateUniqueID";
import { editName as questionEditName } from "@ext/markdown/elements/question/consts";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import type { QuizCorrect } from "@ext/markdown/elements/question/types";
import { findParentNode, type RawCommands } from "@tiptap/core";

export const addQuestionAnswer: RawCommands["addQuestionAnswer"] =
	(options?: { correct?: QuizCorrect }) =>
	({ commands, editor }) => {
		const parentQuestion = findParentNode((node) => node.type.name === questionEditName)(editor.state.selection);
		if (!parentQuestion) return false;

		let hasNullAnswers = false;
		parentQuestion.node.content.forEach((node) => {
			if (node.attrs.correct !== null) return;
			hasNullAnswers = true;
		});

		const questionAnswer = editor.schema.nodes.questionAnswer.create(
			{
				answerId: generateUniqueID(),
				correct: hasNullAnswers ? null : (options?.correct ?? false),
				type: answerTypeByQuestionType[parentQuestion.node.attrs.type],
				questionId: parentQuestion.node.attrs.id,
			},
			[editor.schema.nodes.paragraph.create()],
		);

		return commands.insertContentAt(parentQuestion.pos + parentQuestion.node.content.size - 1, questionAnswer);
	};
