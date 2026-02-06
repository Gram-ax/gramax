import Workspace from "@core-ui/ContextServices/Workspace";
import { PropsEditorFormValues } from "@ext/item/actions/propsEditor/components/PropsEditor";
import t from "@ext/localization/locale/translate";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { getQuizBlocksCount } from "@ext/quiz/logic/getQuizBlocksCount";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Divider } from "@ui-kit/Divider";
import { FormField } from "@ui-kit/Form";
import { FormSectionTitle } from "@ui-kit/Form/FormSectionTitle";
import { Icon } from "@ui-kit/Icon";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "@ui-kit/Slider";
import { SwitchField } from "@ui-kit/Switch";
import { useCallback, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface QuizSettingsFieldsProps {
	isCurrentItem: boolean;
	form: UseFormReturn<PropsEditorFormValues>;
}

export const QuizSettingsFields = ({ isCurrentItem, form }: QuizSettingsFieldsProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const workspace = Workspace.current();
	const showQuizSettings = workspace.enterprise?.gesUrl && workspace.enterprise?.modules?.quiz;

	const toggleShowAnswers = useCallback(
		(value: boolean) => {
			form.setValue("quiz.showAnswers", value);
		},
		[form],
	);

	const quizBlocksCount = useMemo(() => getQuizBlocksCount(EditorService.getEditor().getJSON()), []);

	if (!showQuizSettings || !isCurrentItem || !quizBlocksCount) return null;

	return (
		<>
			<Divider />
			<Collapsible onOpenChange={setIsOpen} open={isOpen}>
				<CollapsibleTrigger className="w-full flex justify-between items-center">
					<FormSectionTitle children={t("quiz.settings.name")} />
					<Icon className="text-primary" icon={isOpen ? "chevron-down" : "chevron-right"} />
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-5 lg:space-y-4 pt-4">
					<SwitchField
						alignment="right"
						checked={form.watch("quiz.showAnswers")}
						className="justify-between"
						description={t("quiz.settings.show-answers.description")}
						label={t("quiz.settings.show-answers.title")}
						onCheckedChange={toggleShowAnswers}
						size="sm"
					/>
					<FormField
						control={({ field }) => (
							<div className="flex flex-col gap-4 relative">
								<output
									className="text-md font-normal text-right tabular-nums text-primary-fg absolute"
									style={{ right: 0, bottom: "0.65rem" }}
								>
									{field.value || 0}/{quizBlocksCount}
								</output>
								<Slider
									max={quizBlocksCount}
									min={0}
									onValueChange={(value) => form.setValue("quiz.countOfCorrectAnswers", value[0])}
									value={[field.value || 0]}
								>
									<SliderTrack>
										<SliderRange />
									</SliderTrack>
									<SliderThumb />
								</Slider>
							</div>
						)}
						description={t("quiz.settings.precent-of-correct-answers.description")}
						labelClassName="w-56"
						layout="vertical"
						name="quiz.countOfCorrectAnswers"
						title={t("quiz.settings.precent-of-correct-answers.title")}
					/>
				</CollapsibleContent>
			</Collapsible>
		</>
	);
};
