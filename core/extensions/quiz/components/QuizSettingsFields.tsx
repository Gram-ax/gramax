import { FormSectionTitle } from "@ui-kit/Form/FormSectionTitle";
import { Divider } from "@ui-kit/Divider";
import t from "@ext/localization/locale/translate";
import { SwitchField } from "@ui-kit/Switch";
import { FormField } from "@ui-kit/Form";
import { UseFormReturn } from "react-hook-form";
import { PropsEditorFormValues } from "@ext/item/actions/propsEditor/components/PropsEditor";
import { useCallback, useMemo, useState } from "react";
import Workspace from "@core-ui/ContextServices/Workspace";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";
import { Slider, SliderRange, SliderTrack, SliderThumb } from "@ui-kit/Slider";
import { getQuizBlocksCount } from "@ext/quiz/logic/getQuizBlocksCount";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";

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
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger className="w-full flex justify-between items-center">
					<FormSectionTitle children={t("quiz.settings.name")} />
					<Icon icon={isOpen ? "chevron-down" : "chevron-right"} className="text-primary" />
				</CollapsibleTrigger>
				<CollapsibleContent className="space-y-5 lg:space-y-4 pt-4">
					<SwitchField
						label={t("quiz.settings.show-answers.title")}
						description={t("quiz.settings.show-answers.description")}
						size="sm"
						alignment="right"
						className="justify-between"
						checked={form.watch("quiz.showAnswers")}
						onCheckedChange={toggleShowAnswers}
					/>
					<FormField
						name="quiz.countOfCorrectAnswers"
						title={t("quiz.settings.precent-of-correct-answers.title")}
						description={t("quiz.settings.precent-of-correct-answers.description")}
						labelClassName="w-56"
						layout="vertical"
						control={({ field }) => (
							<div className="flex flex-col gap-4 relative">
								<output
									className="text-md font-normal text-right tabular-nums text-primary-fg absolute"
									style={{ right: 0, bottom: "0.65rem" }}
								>
									{field.value || 0}/{quizBlocksCount}
								</output>
								<Slider
									min={0}
									max={quizBlocksCount}
									value={[field.value || 0]}
									onValueChange={(value) => form.setValue("quiz.countOfCorrectAnswers", value[0])}
								>
									<SliderTrack>
										<SliderRange />
									</SliderTrack>
									<SliderThumb />
								</Slider>
							</div>
						)}
					/>
				</CollapsibleContent>
			</Collapsible>
		</>
	);
};
