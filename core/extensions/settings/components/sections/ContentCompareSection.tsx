import t from "@ext/localization/locale/translate";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import SettingField from "@ext/settings/components/SettingField";
import type { AppSettingsFormData } from "@ext/settings/logic/formSchema";
import { DiffExtension } from "@gaurussel/tiptap-diff-utility";
import Document from "@tiptap/extension-document";
import { EditorContent, EditorContext, type JSONContent, useEditor } from "@tiptap/react";
import { Divider } from "@ui-kit/Divider";
import { FormStack } from "@ui-kit/Form";
import { Label } from "@ui-kit/Label";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "@ui-kit/Slider";
import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

type SliderSpec = {
	name: "minSimilarity" | "debounce" | "minMatchLength";
	titleKey:
		| "app-settings.content-compare.min-similarity.title"
		| "app-settings.content-compare.debounce.title"
		| "app-settings.content-compare.min-match-length.title";
	descKey:
		| "app-settings.content-compare.min-similarity.description"
		| "app-settings.content-compare.debounce.description"
		| "app-settings.content-compare.min-match-length.description";
	min: number;
	max: number;
	step: number;
};

const SLIDERS: readonly SliderSpec[] = [
	{
		name: "minSimilarity",
		titleKey: "app-settings.content-compare.min-similarity.title",
		descKey: "app-settings.content-compare.min-similarity.description",
		min: 0,
		max: 1,
		step: 0.1,
	},
	{
		name: "debounce",
		titleKey: "app-settings.content-compare.debounce.title",
		descKey: "app-settings.content-compare.debounce.description",
		min: 0,
		max: 1000,
		step: 50,
	},
	{
		name: "minMatchLength",
		titleKey: "app-settings.content-compare.min-match-length.title",
		descKey: "app-settings.content-compare.min-match-length.description",
		min: 1,
		max: 10,
		step: 1,
	},
];

const paragraph = (text: string): JSONContent => ({
	type: "paragraph",
	content: [{ type: "text", text }],
});

const doc = (...texts: string[]): JSONContent => ({ type: "doc", content: texts.map(paragraph) });

const previewBaseline = () =>
	doc(
		t("app-settings.content-compare.preview.before.typo"),
		t("app-settings.content-compare.preview.before.reworded"),
		t("app-settings.content-compare.preview.before.survivors"),
	);

const previewContent = () =>
	doc(
		t("app-settings.content-compare.preview.after.typo"),
		t("app-settings.content-compare.preview.after.reworded"),
		t("app-settings.content-compare.preview.after.survivors"),
	);

const EditorPreview = ({ form }: { form: UseFormReturn<AppSettingsFormData> }) => {
	const sensitivity = form.watch("contentCompare.sensitivity");
	const minSimilarity = form.watch("contentCompare.minSimilarity");
	const debounce = form.watch("contentCompare.debounce");
	const minMatchLength = form.watch("contentCompare.minMatchLength");

	const baseline = useMemo(() => previewBaseline(), []);
	const content = useMemo(() => previewContent(), []);

	const editor = useEditor({
		editable: false,
		extensions: [
			Document,
			Comment.configure({
				enabled: false,
			}),
			...getSimpleExtensions(),
			DiffExtension.configure({
				baseline,
				minSimilarity: minSimilarity,
				debounceMs: debounce,
				minMatchLength: minMatchLength,
				sensitivity: sensitivity,
			}),
		],
		content,
	});

	useEffect(() => {
		if (!editor) return;
		editor.commands.setDiffOptions({
			enabled: true,
			baseline,
			minSimilarity: minSimilarity,
			debounceMs: debounce,
			minMatchLength: minMatchLength,
			sensitivity: sensitivity,
		});
	}, [baseline, minSimilarity, debounce, minMatchLength, sensitivity, editor]);

	return (
		<div className="space-y-0.5 shrink-0 px-4 py-5 lg:p-6 pt-0 lg:pt-0">
			<Label>{t("app-settings.content-compare.preview.title")}</Label>
			<div className="article w-full min-h-14 rounded-lg border border-secondary-border bg-secondary-bg px-3 py-2.5 shadow-soft-sm outline-none lg:py-2 font-sans text-sm">
				<div className="article-body">
					<EditorContext.Provider value={{ editor }}>
						<EditorContent editor={editor} />
					</EditorContext.Provider>
				</div>
			</div>
		</div>
	);
};

export const ContentCompareSection = ({ form }: { form: UseFormReturn<AppSettingsFormData> }) => {
	return (
		<div className="flex flex-col h-full min-h-0 gap-4">
			<ScrollShadowContainer className="px-4 py-5 lg:p-6 flex-1 min-h-0">
				<FormStack className="min-h-0">
					<SettingField
						control={({ field }) => (
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="hybrid">
										{t("app-settings.content-compare.sensitivity.hybrid")}
									</SelectItem>
									<SelectItem value="character">
										{t("app-settings.content-compare.sensitivity.character")}
									</SelectItem>
									<SelectItem value="word">
										{t("app-settings.content-compare.sensitivity.word")}
									</SelectItem>
								</SelectContent>
							</Select>
						)}
						description={t("app-settings.content-compare.sensitivity.description")}
						labelClassName="w-max"
						layout="vertical"
						name="contentCompare.sensitivity"
						title={t("app-settings.content-compare.sensitivity.title")}
					/>
					{SLIDERS.map(({ name, titleKey, descKey, min, max, step }) => (
						<SettingField
							control={({ field }) => (
								<div className="flex items-center gap-3 w-full">
									<Slider
										max={max}
										min={min}
										onValueChange={([v]) => field.onChange(v)}
										step={step}
										value={[Number(field.value ?? min)]}
									>
										<SliderTrack>
											<SliderRange />
										</SliderTrack>
										<SliderThumb />
									</Slider>
									<output className="text-sm tabular-nums min-w-[2.5rem] text-right">
										{Number(field.value ?? min)}
									</output>
								</div>
							)}
							description={t(descKey)}
							key={name}
							labelClassName="w-max"
							layout="vertical"
							name={`contentCompare.${name}` as const}
							title={t(titleKey)}
						/>
					))}
				</FormStack>
			</ScrollShadowContainer>
			<Divider />
			<EditorPreview form={form} />
		</div>
	);
};
