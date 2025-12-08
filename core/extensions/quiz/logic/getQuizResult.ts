import { QuizResult, QuizSettings } from "@ext/quiz/models/types";
import { CheckAnswer } from "@ext/markdown/elements/answer/types";
import { Question } from "@ext/markdown/elements/question/types";
import { isAnswersCorrect } from "@ext/quiz/logic/isAnswersCorrect";

export const getQuizResult = (
	questions: Map<string, Question>,
	answers: CheckAnswer[],
	options?: QuizSettings,
): QuizResult => {
	const results: QuizResult = {
		passed: false,
		questions: isAnswersCorrect(questions, answers, {
			includeCorrectAnswersIds: options?.showAnswers,
		}),
	};

	const countOfCorrectAnswers = results.questions.filter((question) => question.isCorrect).length;
	results.countOfCorrectAnswers = countOfCorrectAnswers;

	if (options?.countOfCorrectAnswers) results.passed = countOfCorrectAnswers >= options.countOfCorrectAnswers;
	else results.passed = results.questions.every((result) => result.isCorrect);

	return results;
};
