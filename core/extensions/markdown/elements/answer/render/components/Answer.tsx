import { classNames } from "@components/libs/classNames";
import { ReactNode, useCallback, memo, HTMLAttributes, useMemo } from "react";
import styled from "@emotion/styled";
import { AnswerType, AnswerValueType } from "@ext/markdown/elements/answer/types";
import { getComponentByType } from "@ext/markdown/elements/answer/edit/logic/getComponentByType";
import { useQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { shallow } from "zustand/shallow";

interface BaseAnswerProps extends HTMLAttributes<HTMLDivElement> {
	correct: boolean;
	children: ReactNode;
	selected?: boolean;
	disabled?: boolean;
}

interface BaseComponentProps<T extends AnswerType> {
	value: AnswerValueType<T>;
	onClick?: () => void;
}

interface Props<T extends AnswerType = AnswerType> extends BaseComponentProps<T> {
	type: T;
	children: ReactNode;
	answerId?: string;
	questionId?: string;
}

const baseClassName =
	"answer p-0.5 pl-2 pr-2 rounded-lg border border-secondary-border bg-secondary-bg hover:bg-secondary-bg-hover transition-all text-primary-fg hover:border-primary-border";
const correctClassName =
	"border-status-success-border bg-status-success-bg hover:bg-status-success-bg-hover hover:border-status-success-border";
const incorrectClassName =
	"border-status-error-border bg-status-error-bg hover:bg-status-error-bg-hover hover:border-status-error-border";
const selectedClassName = "hover:bg-secondary-bg-hover bg-primary-bg-hover hover:border-primary-border";
const disabledClassName = "pointer-events-none";

export const AnswerContent = styled.div`
	display: flex;
	gap: 0.5em;
	align-items: center;
	flex: 1;

	> div > :last-of-type {
		margin-bottom: 0;
	}
`;

export const BaseAnswer = memo(
	({ children, correct, selected, disabled, className = "", ...props }: BaseAnswerProps) => {
		return (
			<div
				{...props}
				className={classNames(
					baseClassName,
					{
						[correctClassName]: correct,
						[incorrectClassName]: typeof correct === "boolean" && !correct,
						[selectedClassName]: selected,
						[disabledClassName]: disabled,
					},
					[className],
				)}
			>
				{children}
			</div>
		);
	},
);

export const Answer = memo(
	({ children, type, answerId, questionId, ...props }: Omit<Props, "value" | "onClick">): JSX.Element => {
		const { isCorrected, setAnswer, isSelected, state } = useQuestionsStore((store) => {
			const question = store.questions[questionId];

			if (!question) {
				return {
					isCorrected: undefined,
					setAnswer: () => {},
					isSelected: false,
					state: "answering",
				};
			}

			const state = store.state;
			const isSelected = question.selectedAnswers.includes(answerId);
			const isCorrected =
				state !== "answering"
					? question.selectedAnswers.length > 0
						? isSelected
							? question.isCorrected
							: undefined
						: false
					: undefined;

			return {
				isCorrected,
				setAnswer: store.selectAnswer,
				isSelected,
				state,
			};
		}, shallow);

		const onClick = useCallback(() => {
			setAnswer(questionId, answerId);
		}, [answerId, setAnswer]);

		const Component = useMemo(() => getComponentByType({ type, value: isSelected }), [type, isSelected]);

		return (
			<BaseAnswer
				{...props}
				correct={isCorrected}
				selected={isCorrected === undefined && isSelected}
				onClick={onClick}
				className="cursor-pointer"
				disabled={state !== "answering"}
			>
				<AnswerContent>
					{Component}
					<div>{children}</div>
				</AnswerContent>
			</BaseAnswer>
		);
	},
);
