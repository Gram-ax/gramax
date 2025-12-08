import { QuestionsStoreState, StoredQuestion } from "@ext/markdown/elements/question/render/logic/QuestionsStore";

export const getIsCorrected = (question: StoredQuestion, answerId: string, state: QuestionsStoreState["type"]) => {
	let isCorrected = undefined;

	if (state !== "answering" && state !== "loading") {
		if (question.correctAnswers && question.correctAnswers.length > 0) {
			const isCorrectAnswer = question.correctAnswers.includes(answerId);
			if (isCorrectAnswer) {
				isCorrected = true;
			} else if (question.selectedAnswers.includes(answerId)) isCorrected = false;
		} else {
			isCorrected =
				question.selectedAnswers.length > 0
					? question.selectedAnswers.includes(answerId)
						? question.isCorrected
						: undefined
					: false;
		}
	}

	return isCorrected;
};
