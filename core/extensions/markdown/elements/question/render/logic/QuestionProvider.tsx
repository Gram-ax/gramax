import { ReactNode, useState, useCallback, memo, useEffect } from "react";
import { QuestionContext, QuestionContextType } from "./QuestionContext";
import { TypedAnswer } from "@ext/markdown/elements/answer/types";
import { QuestionType } from "@ext/markdown/elements/question/types";
import { useApi } from "@core-ui/hooks/useApi";
import { LocalQuestionsStorage } from "@ext/markdown/elements/question/render/logic/LocalQuestionsStorage";

interface QuestionProviderProps {
	children: ReactNode;
	questionId: string;
	questionType: QuestionType;
}

// В следующей по очереди юзер стори переведу на zustand, поскольку нужен будет глобальный стейт один для всех вопросов
export const QuestionProvider = memo(({ children, questionId, questionType }: QuestionProviderProps) => {
	const [answers, setAnswers] = useState<Map<string, TypedAnswer>>(new Map());
	const [isChecking, setIsChecking] = useState<boolean>(false);
	const [isCorrected, setIsCorrected] = useState<boolean>(null);

	const clearAnswers = useCallback(() => {
		setAnswers(new Map());
	}, []);

	const { call: checkAnswersApi } = useApi<boolean, boolean>({
		url: (api) => api.getAnswers(),
		opts: {
			body: {
				questionId,
				answersIds: Array.from(answers.keys()),
			},
		},
		onError: () => {
			clearAnswers();
			setIsCorrected(null);
			setIsChecking(false);
		},
		onStart: () => {
			setIsChecking(true);
		},
		onFinally: (data) => {
			setIsCorrected(data);
			setIsChecking(false);
		},
	});

	const loadAnswers = useCallback(() => {
		const questionsStorage = new LocalQuestionsStorage();
		const question = questionsStorage.getQuestion(questionId);
		if (!question) return;
		setAnswers(new Map(question.answers.map((answer) => [answer.id, answer])));
	}, [questionId]);

	useEffect(() => {
		loadAnswers();
	}, [loadAnswers]);

	const setAnswer = useCallback(
		(answerId: string, answer: TypedAnswer) => {
			setAnswers((prev) => {
				const newAnswers = new Map(prev);

				if (newAnswers.has(answerId)) {
					newAnswers.delete(answerId);

					return newAnswers;
				}

				if (questionType === "one") newAnswers.clear();
				if (questionType === "one" && answer.type === "radio" && answer.value) {
					for (const [existingAnswerId, existingAnswer] of newAnswers.entries()) {
						if (existingAnswer.type === "radio" && existingAnswerId !== answerId) {
							newAnswers.set(existingAnswerId, { ...existingAnswer, value: false });
						}
					}
				}

				newAnswers.set(answerId, answer);

				const questionsStorage = new LocalQuestionsStorage();
				questionsStorage.saveQuestion(questionId, {
					id: questionId,
					answers: Array.from(newAnswers.values()),
				});
				return newAnswers;
			});
		},
		[questionType],
	);

	const removeAnswer = useCallback((answerId: string) => {
		setAnswers((prev) => {
			const newAnswers = new Map(prev);
			newAnswers.delete(answerId);
			return newAnswers;
		});
	}, []);

	const getAnswer = useCallback(
		(answerId: string): TypedAnswer => {
			return answers.get(answerId);
		},
		[answers],
	);

	const checkAnswers = useCallback(async (): Promise<void> => {
		if (isChecking) return;

		await checkAnswersApi();
	}, [isChecking, checkAnswersApi]);

	const getAllAnswers = useCallback((): TypedAnswer[] => {
		return Array.from(answers.values());
	}, [answers]);

	const canSelectMultiple = useCallback((): boolean => {
		return questionType === "many";
	}, [questionType]);

	const contextValue: QuestionContextType = {
		questionId,
		questionType,
		answers,
		setAnswer,
		clearAnswers,
		removeAnswer,
		checkAnswers,
		getAnswer,
		isChecking,
		isCorrected,
		getAllAnswers,
		canSelectMultiple,
	};

	return <QuestionContext.Provider value={contextValue}>{children}</QuestionContext.Provider>;
});
