import FileInput from "@components/Atoms/FileInput/FileInput";
import { ForTypesField } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideForTypesField";
import {
	forTypesFieldSchema,
	mapForTypesToFormValue,
	validateRuleNameUniqueness,
} from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideRuleCommonLogic";
import { TestSection } from "@ext/enterprise/components/admin/settings/styleGuide/components/ruleEditor/StyleGuideTestSection";
import {
	extractNameFromXml,
	LgtRuleAdapter,
	type StyleGuideRule,
	trimXmlNameName,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormDivider,
	FormFieldControl,
	FormItem,
	FormLabel,
	FormMessage,
	FormStack,
} from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useStyleGuideData, useStyleGuideTests, useStyleGuideUI } from "../../helpers/StyleGuideContext";
import type { ForType, LgtRule } from "../../types";

interface StyleGuideLgtEditorProps {
	ruleAdapted: LgtRuleAdapter;
	allRules: StyleGuideRule[];
	setIsSaving: (value: boolean) => void;
	setDraftRule: (rule: StyleGuideRule) => void;
	onClose: () => void;
	shouldCloseAfterSaveRef: React.MutableRefObject<boolean>;
}

const formSchema = z.object({
	content: z.string().min(1),
	forTypes: forTypesFieldSchema,
});

export const StyleGuideLgtEditor = ({
	ruleAdapted,
	allRules,
	setIsSaving,
	setDraftRule,
	onClose,
	shouldCloseAfterSaveRef,
}: StyleGuideLgtEditorProps) => {
	const { localSettings, handleSave } = useStyleGuideData();
	const { setHasUnsavedChanges } = useStyleGuideUI();
	const { isAnyTestRunning } = useStyleGuideTests();
	const [localRule, setLocalRule] = useState(ruleAdapted);
	const rule = ruleAdapted.getModel() as LgtRule;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: rule.xml,
			forTypes: mapForTypesToFormValue(rule.forTypes),
		},
	});

	useEffect(() => {
		const subscription = form.watch((values) => {
			const currentModel = localRule.getModel();

			const updated = new LgtRuleAdapter({
				...currentModel,
				xml: trimXmlNameName(values.content),
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
		if (!validateName(values.content)) {
			form.setError("content", {
				message: t("enterprise.admin.check.rule-name-duplicate"),
			});
			return;
		}

		setIsSaving(true);
		try {
			const updated = {
				...localSettings,
				lgt: {
					rules: localSettings.lgt.rules.map((r) =>
						r.guid === rule.guid
							? {
									...r,
									xml: trimXmlNameName(values.content),
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
					<FormItem>
						<FormLabel>{t("enterprise.admin.check.rule-name-label")}</FormLabel>
						<FormControl>
							<Input
								disabled
								placeholder={t("enterprise.admin.check.rule-name-placeholder")}
								value={extractNameFromXml(form.getValues().content)}
							/>
						</FormControl>
						<FormDescription>{t("enterprise.admin.check.rule-name-xml-hint")}</FormDescription>
					</FormItem>

					<FormFieldControl
						control={form.control}
						name="content"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("enterprise.admin.check.rule-description-label")}</FormLabel>
								<FormControl>
									<div
										className={`resize-y border rounded-lg overflow-hidden min-h-[156px] h-[300px] ${
											form.formState.errors.content ? "border-destructive" : "border-secondary"
										}`}
									>
										<FileInput
											defaultLanguage="xml"
											height="100%"
											key={rule.guid}
											language="xml"
											onChange={field.onChange}
											options={{
												automaticLayout: true,
												minimap: { enabled: false },
												readOnly: isAnyTestRunning,
												lineNumbers: "on",
												scrollBeyondLastLine: false,
												scrollbar: { alwaysConsumeMouseWheel: false },
											}}
											theme={{ dark: "new-vs-dark", light: "light" }}
											value={field.value}
										/>
									</div>
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
