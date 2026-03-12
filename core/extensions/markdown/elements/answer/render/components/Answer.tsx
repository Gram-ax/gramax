import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import { getLeftComponentByType } from "@ext/markdown/elements/answer/edit/logic/getLeftComponentByType";
import { useAnswerProps } from "@ext/markdown/elements/answer/render/logic/useAnswerProps";
import type { AnswerType, AnswerValueType } from "@ext/markdown/elements/answer/types";
import type { QuizCorrect } from "@ext/markdown/elements/question/types";
import { Skeleton } from "@ui-kit/Skeleton";
import { type HTMLAttributes, memo, type ReactNode, useCallback, useMemo } from "react";
import { getRenderComponentByType } from "../logic/getRenderComponentByType";

interface BaseAnswerContainerProps extends HTMLAttributes<HTMLDivElement> {
	correct: QuizCorrect;
	children: ReactNode;
	selected?: boolean;
	disabled?: boolean;
}

interface BaseComponentProps<T extends AnswerType> {
	value: AnswerValueType<T>;
	onClick?: () => void;
}

interface BaseAnswerProps extends Omit<BaseAnswerContainerProps, "onChange"> {
	type: AnswerType;
	onChange: (value: AnswerValueType<AnswerType>) => void;
	isSelected: boolean;
	isCorrected: QuizCorrect;
	state: string;
	questionId?: string;
	answerId?: string;
}

interface Props<T extends AnswerType = AnswerType> extends BaseComponentProps<T> {
	type: T;
	children: ReactNode;
	answerId?: string;
	questionId?: string;
}

const baseClassName =
	"relative answer p-0.5 pl-2 pr-2 rounded-lg border border-secondary-border bg-secondary-bg hover:bg-secondary-bg-hover transition-all text-primary-fg hover:border-primary-border shadow-soft-sm";
const correctClassName =
	"border-status-success-border bg-status-success-bg hover:bg-status-success-bg-hover hover:border-status-success-border";
const incorrectClassName =
	"border-status-error-border bg-status-error-bg hover:bg-status-error-bg-hover hover:border-status-error-border";
const selectedClassName = "hover:bg-secondary-bg-hover bg-primary-bg hover:border-primary-border";
const infoClassName = "bg-primary-bg";
const disabledClassName = "pointer-events-none";

export const AnswerContent = styled.div`
	display: flex;
	gap: 0.5em;
	align-items: center;
	flex: 1;

	&.invisible {
		opacity: 0;
		pointer-events: none;
	}

	> div > :last-of-type {
		margin-bottom: 0;
	}
`;

export const BaseAnswerContainer = memo(
	({ children, correct, selected, disabled, className = "", ...props }: BaseAnswerContainerProps) => {
		return (
			<div
				{...props}
				className={cn(
					baseClassName,
					correct && correctClassName,
					typeof correct === "boolean" && !correct && incorrectClassName,
					selected && selectedClassName,
					className,
					disabled && correct === null && infoClassName,
					disabled && disabledClassName,
				)}
			>
				{children}
			</div>
		);
	},
);

const BaseAnswer = memo((props: BaseAnswerProps): JSX.Element => {
	const { type, answerId, questionId, onChange, isSelected, isCorrected, state, children, ...restProps } = props;

	const LeftComponent = useMemo(() => getLeftComponentByType({ type, value: isSelected }), [type, isSelected]);

	const onClick = useCallback(() => {
		onChange?.(!isSelected);
	}, [onChange, isSelected]);

	return (
		<BaseAnswerContainer
			{...restProps}
			className="cursor-pointer"
			correct={isCorrected}
			disabled={state !== "answering"}
			onClick={onClick}
			selected={isCorrected === undefined && isSelected}
		>
			{state === "loading" && <Skeleton className="absolute top-0 left-0 w-full h-full" />}
			<AnswerContent className={cn(state === "loading" && "invisible")}>
				{LeftComponent}
				<div>{children}</div>
			</AnswerContent>
		</BaseAnswerContainer>
	);
});

export const Answer = memo(
	({ type, answerId, questionId, ...props }: Omit<Props, "value" | "onClick">): JSX.Element => {
		const { isCorrected, setAnswer, value, state } = useAnswerProps(questionId, answerId);

		const onChange = useCallback(
			(value: AnswerValueType<AnswerType>) => {
				setAnswer(questionId, answerId, value);
			},
			[answerId, setAnswer, questionId],
		);

		const renderComponent = useMemo(() => {
			return getRenderComponentByType({ type, value, onChange, disabled: state !== "answering" });
		}, [type, value, onChange, state]);

		if (renderComponent) return renderComponent;

		return (
			<BaseAnswer
				{...(props as BaseAnswerProps)}
				answerId={answerId}
				isCorrected={isCorrected}
				isSelected={!!value}
				onChange={onChange}
				questionId={questionId}
				state={state}
				type={type}
			/>
		);
	},
);
