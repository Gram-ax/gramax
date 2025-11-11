export type AnswerType = "checkbox" | "radio";

export type AnswerValueType<T extends AnswerType> = T extends "checkbox" | "radio" ? boolean : unknown;

export interface TypedAnswer<T extends AnswerType = AnswerType> {
	id: string;
	type: T;
	value: AnswerValueType<T>;
}

export type Answer = {
	id: string;
	title: string;
	type: AnswerType;
	correct: boolean;
};

export type CheckAnswer = {
	questionId: string;
	answersIds: string[];
};
