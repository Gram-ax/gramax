import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCheckAnswers } from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import { useQuestionsStore } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import { memo, useCallback, useMemo, useState } from "react";
import { GroupHeader } from "@ext/navigation/article/render/GroupHeader";
import styled from "@emotion/styled";
import { Icon } from "@ui-kit/Icon";
import { Button } from "@ui-kit/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import {
	StoredQuestion,
	QuestionsStoreState,
	FocusState,
} from "@ext/markdown/elements/question/render/logic/QuestionsStore";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { FieldLabel } from "@ui-kit/Label";
import { shallow } from "zustand/shallow";
import { toast } from "@ui-kit/Toast";
import Workspace from "@core-ui/ContextServices/Workspace";

const StyledListItem = styled.li`
	label {
		cursor: pointer;
	}

	label:not([data-status]) {
		color: var(--color-primary-general) !important;
	}

	label:not([data-status]):hover {
		color: var(--color-primary) !important;
	}

	label[data-status="success"] {
		color: hsl(var(--status-success) / 0.7);
	}

	label[data-status="error"] {
		color: hsl(var(--status-error) / 0.7);
	}

	label[data-status="success"]:hover {
		color: hsl(var(--status-success));
	}

	label[data-status="error"]:hover {
		color: hsl(var(--status-error));
	}
`;

interface CollapsibleInfoProps {
	answeredCount: number;
	totalCount: number;
	state: QuestionsStoreState["type"];
	questions: StoredQuestion[];
	setFocusedQuestion: (questionId: string, state: FocusState) => void;
}

const CollapsibleInfo = ({ answeredCount, totalCount, state, questions, setFocusedQuestion }: CollapsibleInfoProps) => {
	const { isNext } = usePlatform();
	const [open, setOpen] = useState(true);

	const onClickQuestion = useCallback(
		(index: number) => {
			const allQuestions = document.querySelectorAll(".question");
			if (!allQuestions[index]) return;
			allQuestions[index].scrollIntoView({ behavior: "smooth", block: "center" });
			setFocusedQuestion(questions[index].id, "default");
		},
		[questions, setFocusedQuestion],
	);

	const showAnswered = isNext ? answeredCount : undefined;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<GroupHeader>
				<CollapsibleTrigger
					className="w-full flex justify-between items-center"
					style={{ textTransform: "uppercase" }}
				>
					<div className="flex items-center gap-2">
						{t("quiz.info.title")}
						<Icon icon={open ? "chevron-down" : "chevron-right"} />
					</div>
					<div>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>{showAnswered ? `${showAnswered}/${totalCount}` : `${totalCount}`}</span>
							</TooltipTrigger>
							<TooltipContent>
								{showAnswered
									? `${t("quiz.info.answered")}/${t("quiz.info.total")}`
									: t("quiz.info.total")}
							</TooltipContent>
						</Tooltip>
					</div>
				</CollapsibleTrigger>
			</GroupHeader>
			<CollapsibleContent>
				<ul style={{ paddingLeft: "0" }}>
					{questions.map((question, index) => (
						<StyledListItem key={question.id} onClick={() => onClickQuestion(index)}>
							<div className="flex justify-between items-center">
								<FieldLabel required={question.isRequired} className="text-xs font-normal">
									{t("quiz.info.question")} {index + 1}
								</FieldLabel>
								{state === "finished" && (
									<div>
										{question.isCorrected ? (
											<Icon icon="check" className="text-status-success" />
										) : (
											<Icon icon="x" className="text-status-error" />
										)}
									</div>
								)}
							</div>
						</StyledListItem>
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
};

const Statistics = () => {
	const { passed, countOfCorrectAnswers } = useQuestionsStore(
		(store) => ({
			passed: store.state.passed,
			countOfCorrectAnswers: store.state.countOfCorrectAnswers,
		}),
		shallow,
	);
	return (
		<>
			<GroupHeader style={{ marginTop: 0 }}>
				<div>{t("quiz.info.statistics.title")}</div>
			</GroupHeader>
			<ul style={{ paddingLeft: "0" }}>
				<StyledListItem>
					<div className="flex justify-between items-center">
						<FieldLabel className="text-xs font-normal">
							{t("quiz.info.statistics.correct-answers")}
						</FieldLabel>
						<FieldLabel className="text-xs font-normal">
							{countOfCorrectAnswers ? `${countOfCorrectAnswers}` : "0"}
						</FieldLabel>
					</div>
				</StyledListItem>
				{passed ? (
					<StyledListItem>
						<FieldLabel className="text-xs font-normal" data-status="success">
							{t("quiz.info.statistics.passed")}
						</FieldLabel>
					</StyledListItem>
				) : (
					<StyledListItem>
						<FieldLabel className="text-xs font-normal" data-status="error">
							{t("quiz.info.statistics.failed")}
						</FieldLabel>
					</StyledListItem>
				)}
			</ul>
		</>
	);
};

export const QuizNavigationInfo = memo(() => {
	const { isNext } = usePlatform();

	if (!isNext) return null;
	const workspace = Workspace.current();

	if (!workspace?.enterprise?.gesUrl) return null;

	const { state, questions, setFocusedQuestion, isAllRequiredAnswered } = useQuestionsStore(
		(store) => ({
			state: store.state.type,
			questions: store.questions,
			setFocusedQuestion: store.setFocusedQuestion,
			isAllRequiredAnswered: Object.values(store.questions)
				.filter((question) => question.isRequired)
				.every((question) => question.selectedAnswers.length > 0),
		}),
		shallow,
	);

	const questionsArray = useMemo(() => Object.values(questions), [questions]);
	const answeredQuestions = useMemo(
		() => questionsArray.filter((question) => question.selectedAnswers.length),
		[questionsArray],
	);
	const checkAnswers = useCheckAnswers();

	const scrollToFirstRequiredQuestion = useCallback(() => {
		const index = questionsArray.findIndex((question) => question.isRequired && !question.selectedAnswers.length);
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

	if (!questionsArray.length || !workspace?.enterprise?.modules?.quiz) return null;

	return (
		<div className="flex flex-col gap-2">
			<CollapsibleInfo
				answeredCount={answeredQuestions.length}
				totalCount={questionsArray.length}
				state={state}
				questions={questionsArray}
				setFocusedQuestion={setFocusedQuestion}
			/>
			{state === "finished" && <Statistics />}
			{isNext && (
				<>
					<Button
						onClick={checkAnswersHandler}
						startIcon="check"
						variant="text"
						className="w-full"
						size="sm"
						disabled={state !== "answering"}
					>
						{t("quiz.info.send")}
					</Button>
				</>
			)}
		</div>
	);
});
