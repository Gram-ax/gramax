import { cn } from "@core-ui/utils/cn";
import { QuizTestData } from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import t from "@ext/localization/locale/translate";
import { getComponentByType } from "@ext/markdown/elements/answer/edit/logic/getComponentByType";
import { AnswerType } from "@ext/markdown/elements/answer/types";
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
	mappedAnswers: Map<string, string[]>;
}

const ListItem = ({ answer, questionId, mappedAnswers, type }: ListItemProps) => {
	const value = mappedAnswers.get(questionId)?.includes(answer.id) || false;
	const input = getComponentByType({ type, value, disabled: true });

	return (
		<div className="flex items-center gap-2">
			{input}
			<span
				className={cn(answer.correct && "text-status-success", !answer.correct && value && "text-status-error")}
			>
				{answer.title}
			</span>
		</div>
	);
};

export const QuestionsList = ({ data }: { data: QuizTestData }) => {
	const mappedAnswers = useMemo(() => {
		return new Map<string, string[]>(data?.answers.map((answer) => [answer.questionId, answer.answersIds]));
	}, [data?.answers]);

	const correctedQuestions = useMemo(() => {
		if (!data?.questions || !data?.answers) return [];
		const correctedQuestionIds: string[] = [];

		data.questions.forEach((question) => {
			const correctAnswerIds = question.answers?.filter((answer) => answer.correct).map((answer) => answer.id);
			const userAnswerIds = data.answers.find((answer) => answer.questionId === question.id)?.answersIds || [];

			if (!correctAnswerIds) return;

			if (
				correctAnswerIds.length === userAnswerIds.length &&
				correctAnswerIds.every((id) => userAnswerIds.includes(id))
			) {
				correctedQuestionIds.push(question.id);
			}
		});

		return correctedQuestionIds;
	}, [data]);

	if (!data) return;

	return (
		<>
			<div className="text-primary-fg mb-4">
				{t("enterprise.admin.quiz.test-info.correct-answers-count")}: {correctedQuestions.length} (
				{((correctedQuestions.length / data?.questions?.length) * 100).toFixed()}%)
			</div>
			<Stepper orientation="vertical">
				{data?.questions?.map((question, index) => (
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
									correctedQuestions.includes(question.id)
										? "bg-status-success hover:bg-status-success-hover"
										: "bg-status-error hover:bg-status-error-hover",
								)}
							>
								{index + 1}
							</StepperIndicator>
							<div className="px-2 text-left">
								<StepperTitle className="text-lg mb-2">{question.title}</StepperTitle>
								{question.answers?.map((answer) => (
									<ListItem
										answer={answer}
										key={answer.id}
										mappedAnswers={mappedAnswers}
										questionId={question.id}
										type={
											question.answers.filter((a) => a.correct).length > 1 ? "checkbox" : "radio"
										}
									/>
								))}
							</div>
						</StepperTrigger>
						{index + 1 < data?.questions?.length && (
							<StepperSeparator className="absolute inset-y-0 left-3 top-[calc(1.5rem+0.125rem)] -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
						)}
					</StepperItem>
				))}
			</Stepper>
		</>
	);
};
