import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { useQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { QuestionType } from "@ext/markdown/elements/question/types";
import { ReactNode, memo } from "react";
import { shallow } from "zustand/shallow";
import { FocusState } from "../logic/QuestionsStore";

const Wrapper = styled.div`
	&.shadow-focus-error {
		--tw-shadow: 0px 0px 0px 1px hsl(var(--status-error));
		--tw-shadow-colored: 0px 0px 0px 1px var(--tw-shadow-color);
		box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
	}
`;

const StyledContent = styled.div`
	> div > div > p:first-of-type {
		font-size: 1.2em;
		font-weight: 600;
		line-height: 1.6;
		margin-bottom: 0.4em;
		color: var(--color-article-heading-text);
	}

	> div > div {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	&[data-required="true"] {
		> div > div > p:first-of-type::after {
			content: "*";
			color: hsl(var(--status-error));
			margin-left: 0.2em;
		}
	}
`;

interface BaseQuestionProps {
	children: ReactNode;
	id?: string;
	type?: QuestionType;
	required?: boolean;
	focused?: boolean;
	focusState?: FocusState;
}

export const BaseQuestion = memo(({ children, required, focused, focusState }: BaseQuestionProps) => {
	return (
		<Wrapper
			data-required={required}
			className={classNames("question flex bg-primary-bg rounded-xl border border-secondary-border", {
				"shadow-focus": focused && focusState !== "error",
				"shadow-focus-error": focused && focusState === "error",
			})}
		>
			<div className="p-4" contentEditable={false}>
				<div className="question-number flex items-center justify-center border text-secondary-fg shadow-soft-sm h-8 w-8 p-2 border-primary-border bg-secondary-bg-hover rounded-full font-medium" />
			</div>
			<StyledContent className="flex flex-col gap-4 w-full p-4 pl-0" data-required={required}>
				{children}
			</StyledContent>
		</Wrapper>
	);
});

export const Question = ({ children, id, required }: BaseQuestionProps) => {
	const { isFocused, focusState } = useQuestionsStore(
		(store) => ({
			isFocused: store.focusState?.questionId === id,
			focusState: store.focusState?.state,
		}),
		shallow,
	);

	return (
		<div className="mb-4 mt-4">
			<BaseQuestion required={required} focused={isFocused} focusState={focusState}>
				<div>
					<div>{children}</div>
				</div>
			</BaseQuestion>
		</div>
	);
};
