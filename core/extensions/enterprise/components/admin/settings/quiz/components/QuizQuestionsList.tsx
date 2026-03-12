import { cn } from "@core-ui/utils/cn";
import type { QuizTestData } from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import t from "@ext/localization/locale/translate";
import { getAvailableChildrens } from "@ext/markdown/elements/answer/edit/logic/getAvailableChildrens";
import { getLeftComponentByType } from "@ext/markdown/elements/answer/edit/logic/getLeftComponentByType";
import type { AnswerType, StoredAnswer } from "@ext/markdown/elements/answer/types";
import { answerTypeByQuestionType } from "@ext/markdown/elements/question/edit/logic/answerTypeByQuestionType";
import {
	Stepper,
	StepperIndicator,
	StepperItem,
	StepperSeparator,
	StepperTitle,
	StepperTrigger,
} from "@ui-kit/Stepper";
import { useMemo } from "react";

interface ListItemProps {
	questionId: string;
	answer: QuizTestData["questions"][number]["answers"][number];
	type: AnswerType;
	mappedAnswers: Map<string, StoredAnswer>;
	isNull: boolean;
}

const ListItem = ({ answer, questionId, mappedAnswers, type, isNull }: ListItemProps) => {
	const value = mappedAnswers.get(questionId)?.[answer.id] || false;
	const { left } = getAvailableChildrens(type);
	const input = left ? getLeftComponentByType({ type, value, disabled: true }) : null;

	return (
		<div className="flex items-center gap-2">
			{input}
			<span
				className={cn(
					!isNull && answer.correct && "text-status-success",
					!isNull && !answer.correct && value && "text-status-error",
				)}
			>
				{typeof value === "string" ? value : answer.title}
			</span>
		</div>
	);
};

export const QuestionsList = ({ data }: { data: QuizTestData }) => {
	const mappedAnswers = useMemo(() => {
		return new Map<string, StoredAnswer>(data?.answers.map((answer) => [answer.questionId, answer.answersIds]));
	}, [data?.answers]);

	const correctedQuestions = useMemo(() => {
		if (!data?.questions || !data?.answers) return [];
		const correctedQuestionIds: string[] = [];

		data.questions.forEach((question) => {
			const correctAnswerIds = question.answers?.filter((answer) => answer.correct).map((answer) => answer.id);
			const userAnswerIds = mappedAnswers.get(question.id) || {};

			if (!correctAnswerIds || !correctAnswerIds.length) return;

			if (correctAnswerIds.every((id) => userAnswerIds[id])) {
				correctedQuestionIds.push(question.id);
			}
		});

		return correctedQuestionIds;
	}, [data, mappedAnswers]);

	if (!data) return;

	return (
		<>
			<div className="text-primary-fg mb-4">
				{correctedQuestions.length > 0 ? (
					<>
						{t("enterprise.admin.quiz.test-info.correct-answers-count")}: {correctedQuestions.length} (
						{((correctedQuestions.length / (data?.questions?.length || 1)) * 100).toFixed()}%)
					</>
				) : (
					<>
						{t("enterprise.admin.quiz.test-info.answers-count")}: {data?.answers?.length}
					</>
				)}
			</div>
			<Stepper className="w-full" orientation="vertical">
				{data?.questions?.map((question, index) => {
					const isNullAnswers = question.answers.some((a) => a.correct === null);
					const answerType = answerTypeByQuestionType[question.type];
					return (
						<StepperItem
							className="not-last:flex-1 relative items-start"
							disabled
							key={question.id}
							step={index + 1}
						>
							<StepperTrigger className="items-start rounded pb-12 last:pb-0" style={{ opacity: "1" }}>
								<StepperIndicator
									asChild
									className={cn(
										"text-primary-bg",
										!isNullAnswers && correctedQuestions.includes(question.id)
											? "bg-status-success hover:bg-status-success-hover"
											: !isNullAnswers && "bg-status-error hover:bg-status-error-hover",
										isNullAnswers && "bg-status-info hover:bg-status-info-hover",
									)}
								>
									{index + 1}
								</StepperIndicator>
								<div className="px-2 text-left">
									<StepperTitle className="text-lg mb-2">{question.title}</StepperTitle>
									{question.answers?.map((answer) => (
										<ListItem
											answer={answer}
											isNull={isNullAnswers}
											key={answer.id}
											mappedAnswers={mappedAnswers}
											questionId={question.id}
											type={answerType}
										/>
									))}
								</div>
							</StepperTrigger>
							{index + 1 < data?.questions?.length && (
								<StepperSeparator className="absolute inset-y-0 left-3 top-[calc(1.5rem+0.125rem)] -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
							)}
						</StepperItem>
					);
				})}
			</Stepper>
		</>
	);
};
