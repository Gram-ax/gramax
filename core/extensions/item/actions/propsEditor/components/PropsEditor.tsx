import { NEW_ARTICLE_REGEX } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";
import { getClientDomain } from "@core/utils/getClientDomain";
import { uniqueName } from "@core/utils/uniqueName";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import AliasesInput from "@ext/item/actions/propsEditor/components/AliasesInput";
import type { UsePropsEditorActionsParams } from "@ext/item/actions/propsEditor/logic/usePropsEditorAcitions";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import { QuizSettingsFields } from "@ext/quiz/components/QuizSettingsFields";
import type { QuizSettings } from "@ext/quiz/models/types";
import { getCachedSetting } from "@ext/settings/logic/cachedSettingsStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, IconButton } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input, InputGroup, InputGroupInput, InputGroupText } from "@ui-kit/Input";
import { TagInput } from "@ui-kit/TagInput";
import { Textarea } from "@ui-kit/Textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type FC, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

interface PropsEditorProps extends Omit<UsePropsEditorActionsParams, "onExternalClose"> {
	submit: SubmitHandler<{ title: string; fileName: string }>;
	onClose?: () => void;
	isCurrentItem: boolean;
}

const getSchema = (brotherFileNames: RefObject<string[]>, takenAliases: RefObject<string[]>) => {
	return z.object({
		title: z.string().min(1, { message: t("must-be-not-empty") }),
		description: z.string().optional().default(""),
		fileName: z
			.string()
			.min(1, { message: t("must-be-not-empty") })
			.refine((val) => /^[\w\d\-_]+$/m.test(val), {
				message: t("no-encoding-symbols-in-url-no-dot"),
			})
			.refine((val) => !brotherFileNames.current?.includes(val.toLowerCase()), {
				message: t("cant-be-same-name"),
			}),
		quiz: z
			.object({
				showAnswers: z
					.boolean()
					.optional()
					.transform((val) => (val === true ? true : undefined)),
				canRetake: z
					.boolean()
					.optional()
					.transform((val) => (val === true ? true : undefined)),
				countOfCorrectAnswers: z
					.number()
					.optional()
					.nullable()
					.transform((val) => (typeof val === "number" ? val : undefined)),
			})
			.nullable()
			.optional()
			.transform((val) => {
				if (!val) return undefined;
				const newVal = Object.fromEntries(Object.entries(val).filter(([_, value]) => value !== undefined));
				return Object.keys(newVal || {}).length ? (newVal as QuizSettings) : undefined;
			}),
		searchPhrases: z.array(z.string().min(1, { message: t("must-be-not-empty") })).nullish(),
		aliases: z
			.array(
				z
					.string()
					.min(1, { message: t("must-be-not-empty") })
					.refine((val) => val.split("/").every((segment) => /^[\w\d\-_]+$/m.test(segment)), {
						message: t("no-encoding-symbols-in-url-no-dot"),
					})
					.refine((val) => !takenAliases.current?.includes(val), {
						message: t("alias-taken"),
					}),
			)
			.nullish(),
	});
};

export type PropsEditorFormValues = z.infer<ReturnType<typeof getSchema>>;

const PropsEditor: FC<PropsEditorProps> = (props) => {
	const [open, setOpen] = useState(true);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const webEditorUrl = getCachedSetting("services.web-editor.endpoint");
	const { onClose, submit, item, itemLink, isCategory, ...hookParams } = props;
	const formRef = useRef<HTMLFormElement>(null);
	const brotherFileNames = useRef<string[]>([]);
	const takenAliases = useRef<string[]>([]);

	const formSchema = useMemo(() => getSchema(brotherFileNames, takenAliases), []);

	const form = useForm<PropsEditorFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: item?.title === t("article.no-name") ? "" : item?.title,
			description: item?.description ?? "",
			fileName: item?.fileName,
			quiz: item?.quiz,
			searchPhrases: item?.searchPhrases ?? [],
			aliases: (item?.aliases ?? []).map((a) => (typeof a === "string" ? a : a.path)),
		},
		mode: "onChange",
	});

	const { handleSubmit, watch, setValue } = form;

	const watchTitle = watch("title");

	const setBrotherFileNames = useCallback(async () => {
		if (!itemLink?.ref?.path) return;
		const response = await FetchService.fetch(apiUrlCreator.getArticleBrotherFileNames(itemLink?.ref?.path));
		if (!response.ok) return;
		const data = (await response.json()) as string[];
		brotherFileNames.current = data;
	}, [itemLink?.ref?.path]);

	const setTakenAliases = useCallback(async () => {
		if (!itemLink?.ref?.path) return;
		const response = await FetchService.fetch(apiUrlCreator.getArticleTakenAliases(itemLink?.ref?.path));
		if (!response.ok) return;
		takenAliases.current = (await response.json()) as string[];
	}, [itemLink?.ref?.path]);

	useWatch(() => {
		void setBrotherFileNames();
		void setTakenAliases();
	}, [itemLink?.ref?.path]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!watchTitle) return;
		if (!NEW_ARTICLE_REGEX.test(item?.fileName)) return;
		if (!form.formState.dirtyFields.fileName) return;

		const newFileName = uniqueName(
			transliterate(watchTitle, { kebab: true, maxLength: 50 }),
			brotherFileNames.current,
		);
		setValue("fileName", newFileName, { shouldValidate: true, shouldDirty: true });
	}, [watchTitle]);

	const formSubmitHandler = useCallback(
		(e) => {
			void handleSubmit(submit)(e);
		},
		[handleSubmit, submit],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setOpen(open);
			if (!open) onClose?.();
		},
		[onClose],
	);

	const fileName = watch("fileName");
	const isOnlyTitleChanged = watch("title") !== item?.title && fileName === item?.fileName;

	const autoAliasPaths = useMemo(
		() => new Set((item?.aliases ?? []).filter((a) => typeof a !== "string").map((a) => a.path)),
		[item?.aliases],
	);
	const aliasesValue = watch("aliases");
	const hasAutoAliases = (aliasesValue ?? []).some((path) => autoAliasPaths.has(path));
	const clearAutoAliases = useCallback(() => {
		setValue(
			"aliases",
			(aliasesValue ?? []).filter((path) => !autoAliasPaths.has(path)),
			{ shouldValidate: true, shouldDirty: true },
		);
	}, [aliasesValue, autoAliasPaths, setValue]);
	const url = useMemo(() => {
		const parentLinkPath = new Path(itemLink?.ref.path).parentDirectoryPath;
		const parentLinkPathValue = (isCategory ? parentLinkPath.parentDirectoryPath : parentLinkPath).value;
		const domain = getClientDomain(webEditorUrl);

		return `${domain}${parentLinkPathValue.startsWith("/") ? parentLinkPathValue : `/${parentLinkPathValue}`}`;
	}, [webEditorUrl, isCategory, itemLink?.ref?.path]);

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent data-modal-root>
				<Form asChild {...form}>
					<form className="contents ui-kit" onSubmit={formSubmitHandler} ref={formRef}>
						<DialogHeader>
							<DialogTitle>{t(`${isCategory ? "section" : "article"}.configure.title`)}</DialogTitle>
						</DialogHeader>
						<DialogBody>
							<FormStack>
								<FormField
									control={({ field }) => (
										<Input
											data-qa={t("title")}
											placeholder={t("forms.article-edit-props.props.title.placeholder")}
											{...field}
											autoFocus
										/>
									)}
									description={t("forms.article-edit-props.props.title.description")}
									labelClassName={"w-44"}
									layout="vertical"
									name="title"
									title={t("forms.article-edit-props.props.title.name")}
								/>

								<FormField
									control={({ field }) => (
										<Textarea
											data-qa={t("forms.article-edit-props.props.description.name")}
											placeholder={t("forms.article-edit-props.props.description.placeholder")}
											rows={3}
											{...field}
										/>
									)}
									description={t("forms.article-edit-props.props.description.description")}
									labelClassName={"w-44"}
									layout="vertical"
									name="description"
									title={t("forms.article-edit-props.props.description.name")}
								/>

								<FormField
									control={({ field, fieldState }) => (
										<InputGroup>
											<InputGroupText className="max-w-[65%] overflow-x-auto whitespace-nowrap [mask-image:linear-gradient(to_left,rgba(255,255,255,0),#fff_15%)]">
												{url}
											</InputGroupText>
											<InputGroupInput
												className="border-l rounded-l-none border-l-secondary-border"
												data-qa="URL"
												error={fieldState?.error?.message}
												placeholder={t("enter-value")}
												{...field}
											/>
										</InputGroup>
									)}
									description={t("forms.article-edit-props.props.url.description")}
									labelClassName={"w-44"}
									layout="vertical"
									name="fileName"
									title={t("forms.article-edit-props.props.url.name")}
								/>

								<QuizSettingsFields form={form} isCurrentItem={hookParams.isCurrentItem} />

								<FormField
									control={({ field }) => (
										<TagInput
											onChange={(newValues) =>
												field.onChange(newValues.length === 0 ? undefined : newValues)
											}
											placeholder={t("forms.article-edit-props.props.searchPhrases.placeholder")}
											{...field}
										/>
									)}
									description={t("forms.article-edit-props.props.searchPhrases.description")}
									labelClassName={"w-44"}
									layout="vertical"
									name="searchPhrases"
									title={t("forms.article-edit-props.props.searchPhrases.name")}
								/>

								<FormField
									control={({ field }) => (
										<AliasesInput
											itemSuffix={(alias) =>
												autoAliasPaths.has(alias) ? (
													<Tooltip>
														<TooltipTrigger asChild>
															<span
																aria-label={t(
																	"forms.article-edit-props.props.aliases.auto-tooltip",
																)}
																className="inline-flex shrink-0 items-center text-muted"
																role="img"
															>
																<Icon icon="pencil-sparkles" size="sm" />
															</span>
														</TooltipTrigger>
														<TooltipContent>
															{t("forms.article-edit-props.props.aliases.auto-tooltip")}
														</TooltipContent>
													</Tooltip>
												) : null
											}
											onChange={field.onChange}
											placeholder={t("forms.article-edit-props.props.aliases.placeholder")}
											value={field.value || []}
										/>
									)}
									description={t("forms.article-edit-props.props.aliases.description")}
									labelClassName={"w-max"}
									labelSuffix={
										hasAutoAliases ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<IconButton
														aria-label={t(
															"forms.article-edit-props.props.aliases.clear-auto",
														)}
														className="p-0"
														icon="trash-2"
														onClick={clearAutoAliases}
														size="xs"
														type="button"
														variant="text"
													/>
												</TooltipTrigger>
												<TooltipContent>
													{t("forms.article-edit-props.props.aliases.clear-auto")}
												</TooltipContent>
											</Tooltip>
										) : null
									}
									layout="vertical"
									name="aliases"
									title={t("forms.article-edit-props.props.aliases.name")}
								/>
							</FormStack>
						</DialogBody>

						<FormFooter
							primaryButton={
								isOnlyTitleChanged ? (
									<Button type="submit">{t("save")}</Button>
								) : (
									<OtherLanguagesPresentWarning action={formSubmitHandler}>
										<Button type="button">{t("save")}</Button>
									</OtherLanguagesPresentWarning>
								)
							}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default PropsEditor;
