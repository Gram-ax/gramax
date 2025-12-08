import { Answer, TypedAnswer } from "@ext/markdown/elements/answer/types";

export type QuestionType = "many" | "one";

export type Question = {
	id: string;
	title: string;
	type: QuestionType;
	answers: Record<string, Answer>;
};

export type SavedQuestion = {
	id: string;
	answers: TypedAnswer[];
};

export type QuestionLocalStorageData = Record<string, Record<string, string[]>>;

export type QuestionResult = {
	questionId: string;
	isCorrect: boolean;
	correctAnswersIds?: string[];
};
