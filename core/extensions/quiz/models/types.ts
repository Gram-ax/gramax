import type { CheckAnswer } from "@ext/markdown/elements/answer/types";
import type { QuestionResult } from "@ext/markdown/elements/question/types";

export interface QuizSettings {
	showAnswers?: boolean;
	canRetake?: boolean;
	countOfCorrectAnswers?: number;
}

export type QuizResult = {
	passed: boolean;
	countOfCorrectAnswers?: number;
	questions: QuestionResult[];
};

export type StoredQuizResult = QuizResult & {
	selectedAnswers: CheckAnswer[];
};

declare module "@core/FileStructue/Item/Item" {
	interface ItemProps {
		quiz?: QuizSettings;
	}
}
