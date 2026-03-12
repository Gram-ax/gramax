import type { Answer, TypedAnswer } from "@ext/markdown/elements/answer/types";
import type { SelectedAnswer } from "./render/logic/QuestionsStore";

export type QuestionType = "many" | "one" | "text";

export type Question = {
	id: string;
	title: string;
	type: QuestionType;
	answers: Record<string, Answer>;
	required?: boolean;
};

export type SavedQuestion = {
	id: string;
	answers: TypedAnswer[];
};

export type QuizCorrect = boolean | null;

export type QuestionLocalStorageData = Record<string, Record<string, SelectedAnswer>>;

export type QuestionResult = {
	questionId: string;
	isCorrect: QuizCorrect;
	correctAnswersIds?: string[];
};
