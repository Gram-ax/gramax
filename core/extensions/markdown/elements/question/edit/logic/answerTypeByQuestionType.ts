import type { AnswerType } from "@ext/markdown/elements/answer/types";
import type { QuestionType } from "@ext/markdown/elements/question/types";

export const answerTypeByQuestionType: { [K in QuestionType]: AnswerType } = {
	one: "radio",
	many: "checkbox",
	text: "text",
};
