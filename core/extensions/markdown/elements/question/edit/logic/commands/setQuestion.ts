import generateUniqueID from "@core/utils/generateUniqueID";
import type { RawCommands } from "@tiptap/core";
import { editName } from "../../../consts";
import type { QuestionType } from "../../../types";
import { answerTypeByQuestionType } from "../answerTypeByQuestionType";

export const setQuestion: RawCommands["setQuestion"] =
	({ options }: { options: { type: QuestionType } }) =>
	({ commands, editor }) => {
		const questionId = generateUniqueID();
		const paragraph = editor.schema.nodes.paragraph.create();
		const questionAnswer = editor.schema.nodes.questionAnswer.create(
			{
				answerId: generateUniqueID(),
				questionId,
				type: answerTypeByQuestionType[options?.type || "one"],
				correct: null,
			},
			[paragraph.copy()],
		);

		const node = editor.schema.nodes[editName]?.create({ id: questionId, ...options }, [paragraph, questionAnswer]);

		return commands.insertContent(node);
	};
