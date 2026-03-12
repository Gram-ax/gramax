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
				value: undefined,
				state: "answering",
			};
		}

		const state = store.state?.type;
		const value = question.selectedAnswers[answerId];
		const isCorrected = getIsCorrected(question, answerId, state);

		return {
			isCorrected,
			setAnswer: store.selectAnswer,
			value,
			state,
		};
	}, shallow);
};
