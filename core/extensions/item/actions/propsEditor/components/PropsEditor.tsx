import { NEW_ARTICLE_REGEX } from "@app/config/const";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import Path from "@core/FileProvider/Path/Path";
import { getClientDomain } from "@core/utils/getClientDomain";
import { uniqueName } from "@core/utils/uniqueName";
import styled from "@emotion/styled";
import { UsePropsEditorActionsParams } from "@ext/item/actions/propsEditor/logic/usePropsEditorAcitions";
import OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import t from "@ext/localization/locale/translate";
import { QuizSettingsFields } from "@ext/quiz/components/QuizSettingsFields";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Form, FormField, FormFooter, FormStack } from "@ui-kit/Form";
import { Input, InputGroup, InputGroupInput, InputGroupText } from "@ui-kit/Input";
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from "@ui-kit/Modal";
import { TagInput } from "@ui-kit/TagInput";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger, useOverflowTooltip } from "@ui-kit/Tooltip";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

interface PropsEditorProps extends Omit<UsePropsEditorActionsParams, "onExternalClose"> {
	submit: SubmitHandler<{ title: string; fileName: string }>;
	onClose?: () => void;
}

const OverflowContainer = styled.div`
	overflow: hidden;
	max-width: 100%;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const getSchema = (brotherFileNames: string[]) => {
	return z.object({
		title: z.string().min(1, { message: t("must-be-not-empty") }),
		fileName: z
			.string()
			.min(1, { message: t("must-be-not-empty") })
			.refine((val) => /^[\w\d\-_]+$/m.test(val), {
				message: t("no-encoding-symbols-in-url"),
			})
			.refine((val) => !brotherFileNames?.includes(val), {
				message: t("cant-be-same-name"),
			}),
		quiz: z
			.object({
				showAnswers: z.boolean().optional(),
				countOfCorrectAnswers: z.number().optional(),
			})
			.nullable()
			.optional(),
		searchPhrases: z.array(z.string().min(1, { message: t("must-be-not-empty") })).nullish(),
	});
};

export type PropsEditorFormValues = z.infer<ReturnType<typeof getSchema>>;

const PropsEditor: FC<PropsEditorProps> = (props) => {
	const [open, setOpen] = useState(true);
	const { ref, open: openOverflow, onOpenChange: onOpenChangeOverflow } = useOverflowTooltip<HTMLDivElement>();

	const apiUrlCreator = ApiUrlCreatorService.value;
	const { onClose, submit, item, itemLink, isCategory, ...hookParams } = props;
	const formRef = useRef<HTMLFormElement>(null);
	const brotherFileNames = useRef<string[]>([]);

	const formSchema = useMemo(() => getSchema(brotherFileNames.current), [brotherFileNames.current]);

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
		const domain = getClientDomain();

		return `${domain}${parentLinkPathValue.startsWith("/") ? parentLinkPathValue : `/${parentLinkPathValue}`}`;
	}, [itemLink?.pathname]);

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent data-modal-root>
				<Form asChild {...form}>
					<form ref={formRef} className="contents ui-kit" onSubmit={formSubmitHandler}>
						<ModalHeader>
							<ModalTitle>{t(`${isCategory ? "section" : "article"}.configure.title`)}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<FormStack>
								<FormField
									name="title"
									title={t("title")}
									layout="vertical"
									control={({ field }) => <Input data-qa={t("title")} {...field} autoFocus />}
									labelClassName={"w-44"}
								/>

								<FormField
									name="fileName"
									title={t("article-url.title")}
									description={t("article-url.description")}
									layout="vertical"
									control={({ field, fieldState }) => (
										<InputGroup>
											<Tooltip open={openOverflow} onOpenChange={onOpenChangeOverflow}>
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
									labelClassName={"w-44"}
								/>

								<QuizSettingsFields isCurrentItem={hookParams.isCurrentItem} form={form} />

								<FormField
									name="searchPhrases"
									title={t("article.searchPhrases.title")}
									description={t("article.searchPhrases.description")}
									layout="vertical"
									control={({ field }) => (
										<TagInput
											placeholder={t("article.searchPhrases.placeholder")}
											onChange={(newValues) =>
												field.onChange(newValues.length === 0 ? undefined : newValues)
											}
											{...field}
										/>
									)}
									labelClassName={"w-44"}
								/>
							</FormStack>
						</ModalBody>

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
			</ModalContent>
		</Modal>
	);
};

export default PropsEditor;
