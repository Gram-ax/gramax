import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import t from "@ext/localization/locale/translate";
import { useQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { Button } from "@ui-kit/Button";
import { shallow } from "zustand/shallow";

export const QuizRetakeButton = () => {
	const articleProps = ArticlePropsService.value;
	const { state, reset } = useQuestionsStore(
		(store) => ({
			state: store.state,
			reset: store.resetStore,
		}),
		shallow,
	);

	const retakeHandler = () => reset();

	if (!articleProps?.quiz?.canRetake || state.passed || state.type !== "finished") return null;

	return (
		<Button disabled={state.type !== "finished"} onClick={retakeHandler} startIcon="rotate-ccw" variant="outline">
			{t("quiz.info.retake")}
		</Button>
	);
};
