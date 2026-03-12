import t from "@ext/localization/locale/translate";
import { useQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { useCheckAnswers } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import { Button } from "@ui-kit/Button";
import { toast } from "@ui-kit/Toast";
import { useCallback, useMemo } from "react";
import { shallow } from "zustand/shallow";

export const QuizSubmitButton = () => {
	const { questions, isAnswering, setFocusedQuestion, isAllRequiredAnswered } = useQuestionsStore(
		(store) => ({
			questions: store.questions,
			isAnswering: store.state.type === "answering",
			isAllRequiredAnswered: Object.values(store.questions)
				.filter((question) => question.isRequired)
				.every((question) => Object.values(question.selectedAnswers).length > 0),
			setFocusedQuestion: store.setFocusedQuestion,
		}),
		shallow,
	);
	const checkAnswers = useCheckAnswers();
	const questionsArray = useMemo(() => Object.values(questions), [questions]);

	const scrollToFirstRequiredQuestion = useCallback(() => {
		const index = questionsArray.findIndex(
			(question) => question.isRequired && !Object.values(question.selectedAnswers).length,
		);
		if (index === -1) return;

		const allQuestions = Array.from(document.querySelectorAll(".question"));
		allQuestions[index].scrollIntoView({ behavior: "smooth", block: "center" });
		setFocusedQuestion(questionsArray[index].id, "error");
	}, [questionsArray, setFocusedQuestion]);

	const checkAnswersHandler = () => {
		if (!isAllRequiredAnswered) {
			scrollToFirstRequiredQuestion();
			return toast(t("quiz.required-questions"), {
				status: "error",
				icon: "triangle-alert",
				duration: 5000,
				position: "top-right",
			});
		}

		checkAnswers();
	};

	if (!isAnswering) return null;

	return (
		<Button disabled={!isAnswering} onClick={checkAnswersHandler} startIcon="check" variant="outline">
			{t("quiz.info.send")}
		</Button>
	);
};
