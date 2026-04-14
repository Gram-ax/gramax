import { NEW_ARTICLE_REGEX } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";
import { getClientDomain } from "@core/utils/getClientDomain";
import { uniqueName } from "@core/utils/uniqueName";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import styled from "@emotion/styled";
import type { UsePropsEditorActionsParams } from "@ext/item/actions/propsEditor/logic/usePropsEditorAcitions";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import { QuizSettingsFields } from "@ext/quiz/components/QuizSettingsFields";
import type { QuizSettings } from "@ext/quiz/models/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@ui-kit/Dialog";
import { Form, FormField, FormFooter, FormStack } from "@ui-kit/Form";
import { Input, InputGroup, InputGroupInput, InputGroupText } from "@ui-kit/Input";
import { TagInput } from "@ui-kit/TagInput";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger, useOverflowTooltip } from "@ui-kit/Tooltip";
import { type FC, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

interface PropsEditorProps extends Omit<UsePropsEditorActionsParams, "onExternalClose"> {
	submit: SubmitHandler<{ title: string; fileName: string }>;
	onClose?: () => void;
	isCurrentItem: boolean;
}

const OverflowContainer = styled.div`
	overflow: hidden;
	max-width: 100%;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const getSchema = (brotherFileNames: RefObject<string[]>) => {
	return z.object({
		title: z.string().min(1, { message: t("must-be-not-empty") }),
		fileName: z
			.string()
			.min(1, { message: t("must-be-not-empty") })
			.refine((val) => /^[\w\d\-_]+$/m.test(val), {
				message: t("no-encoding-symbols-in-url"),
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
	});
};

export type PropsEditorFormValues = z.infer<ReturnType<typeof getSchema>>;

const PropsEditor: FC<PropsEditorProps> = (props) => {
	const [open, setOpen] = useState(true);
	const { ref, open: openOverflow, onOpenChange: onOpenChangeOverflow } = useOverflowTooltip<HTMLDivElement>();

	const apiUrlCreator = ApiUrlCreatorService.value;
	const webEditorUrl = WorkspaceService.current()?.webEditorUrl;
	const { onClose, submit, item, itemLink, isCategory, ...hookParams } = props;
	const formRef = useRef<HTMLFormElement>(null);
	const brotherFileNames = useRef<string[]>([]);

	const formSchema = useMemo(() => getSchema(brotherFileNames), []);

	const form = useForm<PropsEditorFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: item?.title === t("article.no-name") ? "" : item?.title,
			fileName: item?.fileName,
			quiz: item?.quiz,
			searchPhrases: item?.searchPhrases ?? [],
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
	}, [itemLink?.ref?.path, apiUrlCreator]);

	useWatch(() => {
		setBrotherFileNames();
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
			handleSubmit(submit)(e);
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
									control={({ field }) => <Input data-qa={t("title")} {...field} autoFocus />}
									labelClassName={"w-44"}
									layout="vertical"
									name="title"
									title={t("title")}
								/>

								<FormField
									control={({ field, fieldState }) => (
										<InputGroup>
											<Tooltip onOpenChange={onOpenChangeOverflow} open={openOverflow}>
												<TooltipTrigger asChild>
													<InputGroupText style={{ maxWidth: "65%" }}>
														<OverflowContainer ref={ref}>{url}</OverflowContainer>
													</InputGroupText>
												</TooltipTrigger>
												<TooltipContent align="start">
													<TooltipArrow />
													{url}
												</TooltipContent>
											</Tooltip>
											<InputGroupInput
												data-qa="URL"
												error={fieldState?.error?.message}
												placeholder={t("enter-value")}
												{...field}
											/>
										</InputGroup>
									)}
									description={t("article-url.description")}
									labelClassName={"w-44"}
									layout="vertical"
									name="fileName"
									title={t("article-url.title")}
								/>

								<QuizSettingsFields form={form} isCurrentItem={hookParams.isCurrentItem} />

								<FormField
									control={({ field }) => (
										<TagInput
											onChange={(newValues) =>
												field.onChange(newValues.length === 0 ? undefined : newValues)
											}
											placeholder={t("article.searchPhrases.placeholder")}
											{...field}
										/>
									)}
									description={t("article.searchPhrases.description")}
									labelClassName={"w-44"}
									layout="vertical"
									name="searchPhrases"
									title={t("article.searchPhrases.title")}
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
