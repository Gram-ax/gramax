import type { QuizCorrect } from "../question/types";

export type AnswerType = "checkbox" | "radio" | "text";

export type AnswerValueType<T extends AnswerType> = T extends "checkbox" | "radio"
	? boolean
	: T extends "text"
		? string
		: unknown;

export interface TypedAnswer<T extends AnswerType = AnswerType> {
	id: string;
	type: T;
	value: AnswerValueType<T>;
}

export type StoredAnswer = Record<string, AnswerValueType<AnswerType>>;

export type Answer = {
	id: string;
	title: string;
	type: AnswerType;
	correct: QuizCorrect;
};

export type CheckAnswer = {
	questionId: string;
	answersIds: StoredAnswer;
};
