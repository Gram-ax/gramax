import type { CheckAnswer } from "@ext/markdown/elements/answer/types";
import type { Question, QuestionResult } from "@ext/markdown/elements/question/types";

interface isAnswersCorrectOptions {
	// If true, the correct answers ids will be included in the result
	includeCorrectAnswersIds?: boolean;
}

export const isAnswersCorrect = (
	questions: Map<string, Question>,
	answers: CheckAnswer[],
	options?: isAnswersCorrectOptions,
): QuestionResult[] => {
	const { includeCorrectAnswersIds = false } = options || {};
	const results: QuestionResult[] = [];

	for (const checkAnswer of answers) {
		const question = questions.get(checkAnswer.questionId);

		if (!question) {
			results.push({
				questionId: checkAnswer.questionId,
				isCorrect: false,
			});

			continue;
		}

		const correctAnswers = Object.values(question.answers).filter((answer) => answer.correct);
		const correctAnswerIds = new Set(correctAnswers.map((answer) => answer.id));
		const answersIds = new Set(Object.keys(checkAnswer.answersIds));

		if (correctAnswerIds.size === 0) {
			results.push({
				questionId: checkAnswer.questionId,
				correctAnswersIds: undefined,
				isCorrect: null,
			});
			continue;
		}

		let isCorrect = true;

		if (question.type === "text") {
			results.push({
				questionId: checkAnswer.questionId,
				correctAnswersIds: undefined,
				isCorrect: null,
			});
			continue;
		}

		if (correctAnswers.length === 0) isCorrect = null;
		else if (answersIds.size !== correctAnswers.length) isCorrect = false;
		else {
			for (const answerId of answersIds) {
				if (!correctAnswerIds.has(answerId)) {
					isCorrect = false;
					break;
				}
			}

			if (isCorrect) {
				for (const correctAnswerId of correctAnswerIds) {
					if (!answersIds.has(correctAnswerId)) {
						isCorrect = false;
						break;
					}
				}
			}
		}

		results.push({
			questionId: checkAnswer.questionId,
			isCorrect,
			correctAnswersIds: includeCorrectAnswersIds ? Array.from(correctAnswerIds) : undefined,
		});
	}

	return results;
};
