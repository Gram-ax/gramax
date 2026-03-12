import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useApi } from "@core-ui/hooks/useApi";
import type { AnswerType, AnswerValueType, TypedAnswer } from "@ext/markdown/elements/answer/types";
import {
	type QuestionStorage,
	useQuestionsStore,
} from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import type { Question, QuestionResult, QuizCorrect } from "@ext/markdown/elements/question/types";
import type { QuizResult, StoredQuizResult } from "@ext/quiz/models/types";
import { toast } from "@ui-kit/Toast";
import { type DependencyList, useLayoutEffect } from "react";
import { create } from "zustand";
import { shallow } from "zustand/shallow";

export interface StoredAnswer extends Omit<TypedAnswer<AnswerType>, "type"> {}

export type SelectedAnswer = Record<string, AnswerValueType<AnswerType>>;

export interface StoredQuestion extends Omit<Question, "answers"> {
	selectedAnswers: SelectedAnswer;
	answers: Record<string, StoredAnswer>;
	isRequired?: boolean;
	isCorrected?: boolean;
	correctAnswers?: string[];
}

export type QuestionsStoreState = {
	passed: QuizCorrect;
	type: "loading" | "answering" | "checking" | "finished";
	countOfCorrectAnswers?: number;
};

export type FocusState = "default" | "error";

export interface QuestionsStore {
	questions: Record<string, StoredQuestion>;
	state: QuestionsStoreState;
	focusState?: { questionId: string; state: FocusState };
	resetStore: () => void;
	setState: (state: Partial<QuestionsStoreState>) => void;
	setQuestions: (questions: Record<string, StoredQuestion>) => void;
	selectAnswer: (questionId: string, answerId: string, value: AnswerValueType<AnswerType>) => void;
	getAnswer: (questionId: string, answerId: string) => StoredAnswer;
	getSelectedAnswers: (questionId: string) => SelectedAnswer;
	restoreStoredAnswers: (result: StoredQuizResult) => void;
	setIsCorrectedQuestions: (result: QuestionResult[]) => void;
	setFocusedQuestion: (questionId: string, state: FocusState) => void;
}

export const createQuestionsStore = (questions: Record<string, StoredQuestion>, storage: QuestionStorage) => {
	return create<QuestionsStore>((set, get) => ({
		questions: Object.fromEntries(
			Object.entries(questions).map(([questionId, question]) => [
				questionId,
				{
					...question,
					selectedAnswers: storage.getQuestion(questionId),
				},
			]),
		),
		focusState: null,
		state: { type: "loading", passed: false, countOfCorrectAnswers: undefined },
		resetStore: () =>
			set({ questions, state: { type: "answering", passed: false, countOfCorrectAnswers: undefined } }),
		setState: (state: Partial<QuestionsStoreState>) => {
			const oldState = get().state;
			if (state.type === "finished") storage.clearQuestions();
			return set({ state: { ...oldState, ...state } });
		},
		setQuestions: (questions: Record<string, StoredQuestion>) => set({ questions }),
		selectAnswer: (questionId: string, answerId: string, value?: AnswerValueType<AnswerType>) => {
			const { questions } = get();

			const question = questions[questionId];
			if (!question) return;

			const answer = question.answers[answerId];
			if (!answer) return;

			const newValue = value ?? !answer.value;
			let newSelectedAnswers: SelectedAnswer = {};

			if (question.type === "one" && newValue) {
				newSelectedAnswers = { [answerId]: newValue };
			} else {
				if (newValue) {
					newSelectedAnswers = { ...question.selectedAnswers, [answerId]: newValue };
				} else {
					newSelectedAnswers = { ...question.selectedAnswers };
					delete newSelectedAnswers[answerId];
				}
			}

			set({
				questions: {
					...questions,
					[questionId]: {
						...question,
						selectedAnswers: newSelectedAnswers,
					},
				},
				focusState: null,
			});

			storage.saveQuestion(questionId, newSelectedAnswers);
		},
		getAnswer: (questionId: string, answerId: string) => {
			const { questions } = get();
			return questions[questionId]?.answers[answerId];
		},
		getSelectedAnswers: (questionId: string) => {
			const { questions } = get();
			return questions[questionId].selectedAnswers;
		},
		setIsCorrectedQuestions: (results: QuestionResult[]) => {
			const { questions } = get();
			const newQuestions = { ...questions };

			results.forEach((result) => {
				newQuestions[result.questionId].isCorrected = result.isCorrect;
				newQuestions[result.questionId].correctAnswers = result.correctAnswersIds;
			});

			set({ questions: newQuestions });
		},
		setFocusedQuestion: (questionId: string, state: FocusState) => {
			set({
				focusState: { questionId, state },
			});
		},
		restoreStoredAnswers: (result: StoredQuizResult) => {
			const { questions } = get();
			const newQuestions = { ...questions };

			result.questions.forEach((questionResult) => {
				if (newQuestions[questionResult.questionId]) {
					newQuestions[questionResult.questionId] = {
						...newQuestions[questionResult.questionId],
						isCorrected: questionResult.isCorrect,
						correctAnswers: questionResult.correctAnswersIds,
					};
				}
			});

			result.selectedAnswers.forEach((answer) => {
				if (newQuestions[answer.questionId]) {
					newQuestions[answer.questionId] = {
						...newQuestions[answer.questionId],
						selectedAnswers: answer.answersIds,
					};
				}
			});

			set({
				questions: newQuestions,
				state: {
					type: "finished",
					passed: result.passed,
					countOfCorrectAnswers: result.countOfCorrectAnswers,
				},
			});
		},
	}));
};

export const useCheckAnswers = () => {
	const { questions, setState, setIsCorrectedQuestions } = useQuestionsStore(
		(store) => ({
			questions: Object.values(store.questions).map((question) => ({
				questionId: question.id,
				selectedAnswers: question.selectedAnswers,
			})),
			setState: store.setState,
			setIsCorrectedQuestions: store.setIsCorrectedQuestions,
		}),
		shallow,
	);

	const { call: checkAnswers } = useApi<QuizResult>({
		url: (api) => api.getAnswers(),
		opts: {
			body: JSON.stringify({
				answers: Object.values(questions).map((question) => ({
					questionId: question.questionId,
					answersIds: question.selectedAnswers,
				})),
			}),
		},
		onStart: () => setState({ type: "checking" }),
		onError: () => {
			toast("Error checking answers", { status: "error", icon: "triangle-alert", duration: 10000 });
			setState({ type: "answering" });
		},
		onDone: (result) => {
			setIsCorrectedQuestions(result.questions);
			setState({
				type: "finished",
				passed: result.passed,
				countOfCorrectAnswers: result.countOfCorrectAnswers,
			});
		},
	});

	return checkAnswers;
};

export const useIsAnsweredToTest = (deps: DependencyList) => {
	const workspace = Workspace.current();
	const user = PageDataContext.value?.userInfo;

	const { setState, restoreStoredAnswers } = useQuestionsStore(
		(store) => ({
			setState: store.setState,
			restoreStoredAnswers: store.restoreStoredAnswers,
		}),
		shallow,
	);

	const { call: isAnswered } = useApi<StoredQuizResult>({
		url: (api) => api.isAnsweredTest(),
		onError: () => {
			toast("Error checking answers", { status: "error", icon: "triangle-alert", duration: 10000 });
			setState({ type: "answering" });
		},
		onDone: (result) => {
			if (!result) return setState({ type: "answering" });
			restoreStoredAnswers(result);
			setState({
				type: "finished",
				passed: result.passed,
				countOfCorrectAnswers: result.countOfCorrectAnswers,
			});
		},
	});

	useLayoutEffect(() => {
		if (!workspace?.enterprise?.modules?.quiz || !user?.mail) return;
		void isAnswered();
	}, [workspace?.enterprise?.modules?.quiz, isAnswered, user, ...deps]);

	return isAnswered;
};
