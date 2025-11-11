import { useApi } from "@core-ui/hooks/useApi";
import { TypedAnswer, AnswerType } from "@ext/markdown/elements/answer/types";
import { useQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { Question, QuestionResult } from "@ext/markdown/elements/question/types";
import { toast } from "@ui-kit/Toast";
import { create } from "zustand";
import { shallow } from "zustand/shallow";

export interface StoredAnswer extends Omit<TypedAnswer<AnswerType>, "type"> {}

export interface StoredQuestion extends Omit<Question, "answers"> {
	selectedAnswers: string[];
	answers: Record<string, StoredAnswer>;
	isRequired?: boolean;
	isCorrected?: boolean;
}

export type QuestionsStoreState = "answering" | "checking" | "finished";

export type FocusState = "default" | "error";

export interface QuestionsStore {
	questions: Record<string, StoredQuestion>;
	state: QuestionsStoreState;
	focusState?: { questionId: string; state: FocusState };
	resetStore: (content: string) => void;
	setState: (state: QuestionsStoreState) => void;
	setQuestions: (questions: Record<string, StoredQuestion>) => void;
	selectAnswer: (questionId: string, answerId: string) => void;
	getAnswer: (questionId: string, answerId: string) => StoredAnswer;
	getSelectedAnswers: (questionId: string) => string[];
	setIsCorrectedQuestions: (result: QuestionResult[]) => void;
	setFocusedQuestion: (questionId: string, state: FocusState) => void;
}

export const createQuestionsStore = (questions: Record<string, StoredQuestion>) => {
	return create<QuestionsStore>((set, get) => ({
		questions,
		focusState: null,
		state: "answering",
		resetStore: () => set({ questions, state: "answering" }),
		setState: (state: QuestionsStoreState) => set({ state }),
		setQuestions: (questions: Record<string, StoredQuestion>) => set({ questions }),
		selectAnswer: (questionId: string, answerId: string) => {
			const { questions } = get();

			const question = questions[questionId];
			if (!question) return;

			const answer = question.answers[answerId];
			if (!answer) return;

			const newValue = !answer.value;
			const isSelected = question.selectedAnswers.includes(answerId);
			let newSelectedAnswers;

			if (isSelected) newSelectedAnswers = question.selectedAnswers.filter((id) => id !== answerId);
			else if (question.type === "one" && newValue) newSelectedAnswers = [answerId];
			else newSelectedAnswers = [...question.selectedAnswers, answerId];

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
			});

			set({ questions: newQuestions });
		},
		setFocusedQuestion: (questionId: string, state: FocusState) => {
			set({
				focusState: { questionId, state },
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

	const { call: checkAnswers } = useApi<QuestionResult[]>({
		url: (api) => api.getAnswers(),
		opts: {
			body: JSON.stringify({
				answers: Object.values(questions).map((question) => ({
					questionId: question.questionId,
					answersIds: question.selectedAnswers,
				})),
			}),
		},
		onStart: () => setState("checking"),
		onError: () => {
			toast("Error checking answers", { status: "error", icon: "triangle-alert", duration: 10000 });
			setState("answering");
		},
		onDone: (result) => {
			setIsCorrectedQuestions(result);
			setState("finished");
		},
	});

	return checkAnswers;
};
