import type { QuestionsStoreState, StoredQuestion } from "@ext/markdown/elements/question/render/logic/QuestionsStore";

export const getIsCorrected = (question: StoredQuestion, answerId: string, state: QuestionsStoreState["type"]) => {
	if (state === "answering" || state === "loading") return;
	const selectedAnswers = new Map(Object.entries(question.selectedAnswers));

	if (question.correctAnswers && question.correctAnswers.length > 0) {
		const isCorrectAnswer = question.correctAnswers.includes(answerId);
		return isCorrectAnswer || (selectedAnswers.has(answerId) ? false : undefined);
	}

	return selectedAnswers.size > 0 ? (selectedAnswers.has(answerId) ? question.isCorrected : undefined) : false;
};
