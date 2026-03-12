import { memo } from "react";
import { QuizRetakeButton } from "./QuizRetakeButton";
import { QuizSubmitButton } from "./QuizSubmitButton";

export const QuizArticleBottom = memo(() => {
	return (
		<>
			<QuizSubmitButton />
			<QuizRetakeButton />
		</>
	);
});
