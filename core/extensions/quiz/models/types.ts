import { QuestionResult } from "@ext/markdown/elements/question/types";

export interface QuizSettings {
	showAnswers?: boolean;
	countOfCorrectAnswers?: number;
}

export type QuizResult = {
	passed: boolean;
	countOfCorrectAnswers?: number;
	questions: QuestionResult[];
};

export type StoredQuizResult = QuizResult & {
	selectedAnswers: Record<string, string[]>;
};

declare module "@core/FileStructue/Item/Item" {
	interface ItemProps {
		quiz?: QuizSettings;
	}
}
