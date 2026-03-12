import type { CheckAnswer, StoredAnswer } from "@ext/markdown/elements/answer/types";
import type { QuestionType, QuizCorrect } from "@ext/markdown/elements/question/types";

export type QuizSettings = {
	enabled: boolean;
};

export type QuizAnswer = {
	id: string;
	test_id: number;
	user_mail: string;
	score: number;
	successful: boolean;
	answers: CheckAnswer[];
	created_at: Date;
};

export type QuizTestData = {
	answers: { answersIds: StoredAnswer; questionId: string }[];
	questions: { id: string; title: string; answers: QuizTestAnswerData[]; type: QuestionType }[];
};

export type QuizTestAnswerData = {
	id: string;
	title: string;
	correct: QuizCorrect;
};

export type QuizAnswerCreate = Omit<QuizAnswer, "created_at" | "id">;

export type SearchedQuizTest = {
	id: string;
	title: string;
};

export type SearchedAnsweredUsers = {
	user_mail: string;
};

export type QuizTest = {
	id: number;
	test_id: number;
	test_title: string;
	score: number;
	successful: boolean;
	questions_count: number;
	user_mail: string;
	test_version: string;
	test_version_date: string;
	created_at: Date;
};

export type QuizStoredQuestion = {
	id: string;
	title: string;
	type: QuestionType;
	required: boolean;
	answers: QuizTestAnswerData[];
};

export type QuizTestCreate = {
	id: number;
	title: string;
	articleId: number;
	questionsCount: number;
	questions: QuizStoredQuestion[];
};

export type QuizDetailedTest = QuizTest & {
	answers: QuizAnswer[];
};

export type SearchedQuizTestResponse = {
	data: SearchedQuizTest[];
	total: number;
};

export type SearchedAnsweredUsersResponse = {
	data: SearchedAnsweredUsers[];
	total: number;
};
