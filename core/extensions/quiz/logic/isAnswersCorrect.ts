import { CheckAnswer } from "@ext/markdown/elements/answer/types";
import { Question } from "@ext/markdown/elements/question/types";
import { QuestionResult } from "@ext/markdown/elements/question/types";

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

		let isCorrect = true;

		if (correctAnswers.length === 0) isCorrect = true;
		else if (checkAnswer.answersIds.length !== correctAnswers.length) isCorrect = false;
		else {
			for (const answerId of checkAnswer.answersIds) {
				if (!correctAnswerIds.has(answerId)) {
					isCorrect = false;
					break;
				}
			}

			if (isCorrect) {
				const selectedAnswerIds = new Set(checkAnswer.answersIds);
				for (const correctAnswerId of correctAnswerIds) {
					if (!selectedAnswerIds.has(correctAnswerId)) {
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
