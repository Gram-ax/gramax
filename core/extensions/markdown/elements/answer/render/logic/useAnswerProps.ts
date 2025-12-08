import { getIsCorrected } from "@ext/markdown/elements/answer/edit/logic/getIsCorrected";
import { useQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { shallow } from "zustand/shallow";

export const useAnswerProps = (questionId: string, answerId: string) => {
	return useQuestionsStore((store) => {
		const question = store.questions[questionId];

		if (!question) {
			return {
				isCorrected: undefined,
				setAnswer: () => {},
				isSelected: false,
				state: "answering",
			};
		}

		const state = store.state?.type;
		const isSelected = question.selectedAnswers.includes(answerId);
		const isCorrected = getIsCorrected(question, answerId, state);

		return {
			isCorrected,
			setAnswer: store.selectAnswer,
			isSelected,
			state,
		};
	}, shallow);
};
