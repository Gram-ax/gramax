import { AnswerType } from "@ext/markdown/elements/answer/types";
import { QuestionType } from "@ext/markdown/elements/question/types";

export const answerTypeByQuestionType: { [K in QuestionType]: AnswerType } = {
	one: "radio",
	many: "checkbox",
};
