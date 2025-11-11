import { createContext, useContext } from "react";
import { TypedAnswer } from "@ext/markdown/elements/answer/types";
import { QuestionType, SavedQuestion } from "@ext/markdown/elements/question/types";

export interface QuestionContextType {
	questionId: string;
	questionType: QuestionType;
	answers: Map<string, TypedAnswer>;
	isChecking: boolean;
	isCorrected: boolean;
	setAnswer: (answerId: string, answer: TypedAnswer) => void;
	clearAnswers: () => void;
	removeAnswer: (answerId: string) => void;
	getAnswer: (answerId: string) => TypedAnswer;
	getAllAnswers: () => TypedAnswer[];
	canSelectMultiple: () => boolean;
	checkAnswers: () => Promise<void>;
}

export interface QuestionStorage {
	getQuestion: (questionId: string) => SavedQuestion;
	saveQuestion: (questionId: string, question: SavedQuestion) => void;
}

export const QuestionContext = createContext<QuestionContextType>(null);

export const useQuestionContext = (): QuestionContextType => {
	const context = useContext(QuestionContext);

	if (!context) {
		throw new Error("useQuestionContext must be used within a QuestionProvider");
	}

	return context;
};
