import { ForTypesField } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideForTypesField";
import {
	forTypesFieldSchema,
	mapForTypesToFormValue,
	validateRuleNameUniqueness,
} from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideRuleCommonLogic";
import { TestSection } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideTestSection";
import {
	LlmRuleAdapter,
	type StyleGuideRule,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormDivider,
	FormFieldControl,
	FormItem,
	FormLabel,
	FormMessage,
	FormStack,
} from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useStyleGuideData, useStyleGuideTests, useStyleGuideUI } from "../../helpers/StyleGuideContext";
import type { ForType, LlmRule } from "../../types";

interface StyleGuideLlmEditorProps {
	ruleAdapted: LlmRuleAdapter;
	allRules: StyleGuideRule[];
	setDraftRule: (rule: StyleGuideRule) => void;
	setIsSaving: (value: boolean) => void;
	onClose: () => void;
	shouldCloseAfterSaveRef: React.MutableRefObject<boolean>;
}

const formSchema = z.object({
	name: z.string().min(1),
	content: z.string(),
	forTypes: forTypesFieldSchema,
});

export const StyleGuideLlmEditor = ({
	ruleAdapted,
	allRules,
	setDraftRule,
	setIsSaving,
	onClose,
	shouldCloseAfterSaveRef,
}: StyleGuideLlmEditorProps) => {
	const { localSettings, handleSave } = useStyleGuideData();
	const { setHasUnsavedChanges } = useStyleGuideUI();
	const { isAnyTestRunning } = useStyleGuideTests();
	const [localRule, setLocalRule] = useState(ruleAdapted);
	const rule = ruleAdapted.getModel() as LlmRule;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: rule.name,
			content: rule.llmPrompt,
			forTypes: mapForTypesToFormValue(rule.forTypes),
		},
	});

	useEffect(() => {
		const subscription = form.watch((values) => {
			const currentModel = localRule.getModel();

			const updated = new LlmRuleAdapter({
				...currentModel,
				name: values.name.trim(),
				llmPrompt: values.content,
				forTypes: values.forTypes.map((opt) => ({ code: opt.value as ForType })),
			});
			setLocalRule(updated);
			setDraftRule(updated);
			setHasUnsavedChanges(true);
		});
		return () => subscription.unsubscribe();
	}, [form, localRule, setDraftRule, setHasUnsavedChanges]);

	const handleSubmit = async (values: z.infer<typeof formSchema>) => {
		const validateName = validateRuleNameUniqueness(rule.guid, allRules);
		if (!validateName(values.name)) {
			form.setError("name", {
				message: t("enterprise.admin.check.rule-name-duplicate"),
			});
			return;
		}

		setIsSaving(true);
		try {
			const updated = {
				...localSettings,
				llm: {
					rules: (localSettings.llm?.rules ?? []).map((r) =>
						r.guid === rule.guid
							? {
									...r,
									name: values.name.trim(),
									llmPrompt: values.content,
									forTypes: values.forTypes.map((opt) => ({ code: opt.value as ForType })),
								}
							: r,
					),
				},
			};
			await handleSave(updated);
			setHasUnsavedChanges(false);

			if (shouldCloseAfterSaveRef.current) {
				onClose();
				shouldCloseAfterSaveRef.current = false;
			}
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Form {...form} className="border-none">
			<form id="styleguide-form" onSubmit={form.handleSubmit(handleSubmit)}>
				<FormStack>
					<FormFieldControl
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("name")}</FormLabel>
								<FormControl>
									<Input
										disabled={isAnyTestRunning}
										placeholder={t("enterprise.admin.check.rule-name-placeholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormFieldControl
						control={form.control}
						name="content"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("description")}</FormLabel>
								<FormControl>
									<AutogrowTextarea
										disabled={isAnyTestRunning}
										minRows={8}
										placeholder={t("enterprise.admin.check.rule-llm-prompt-placeholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<ForTypesField control={form.control} disabled={isAnyTestRunning} />
				</FormStack>
				<FormDivider />
				<TestSection rule={localRule} />
			</form>
		</Form>
	);
};
