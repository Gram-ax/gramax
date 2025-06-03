import useWatch from "@core-ui/hooks/useWatch";
import { useEffect, useState, Dispatch, SetStateAction, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NEW_ARTICLE_REGEX } from "@app/config/const";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { useRouter } from "@core/Api/useRouter";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { uniqueName } from "@core/utils/uniqueName";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import t from "@ext/localization/locale/translate";
import { ItemLink } from "@ext/navigation/NavigationLinks";

export interface UsePropsEditorActionsParams {
	item: ClientArticleProps;
	itemLink: ItemLink;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	isCategory: boolean;
	isCurrentItem: boolean;
	brotherFileNames: string[];
	onExternalClose?: () => void;
}

export const usePropsEditorActions = (params: UsePropsEditorActionsParams) => {
	const { item, itemLink, setItemLink, isCurrentItem, brotherFileNames, onExternalClose } = params;
	const [open, setOpen] = useState(false);
	const [generatedFileName, setGeneratedFileName] = useState<string | undefined>();

	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;
	const router = useRouter();

	const formSchema = z.object({
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
	});

	type FormValues = z.infer<typeof formSchema>;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: item?.title,
			fileName: item?.fileName,
		},
		mode: "onChange",
	});

	const { watch, setValue, reset, handleSubmit, formState, getValues } = form;

	useWatch(() => {
		form.reset({
			title: item?.title,
			fileName: item?.fileName,
		});
	}, [item?.title, item?.fileName]);

	const watchTitle = watch("title");

	const isOnlyTitleChanged = watchTitle !== item?.title && getValues("fileName") === item?.fileName;

	const updateNavigation = useCallback(
		(updatedPathname: string) => {
			if (isCurrentItem) {
				return router.pushPath(updatedPathname);
			}

			if (!isCurrentItem && articleProps.logicPath.startsWith(item?.logicPath)) {
				return router.pushPath(articleProps.logicPath.replace(item?.logicPath, updatedPathname));
			}

			void refreshPage?.();
		},
		[isCurrentItem, articleProps?.logicPath, item?.logicPath],
	);

	const openModal = useCallback(() => setOpen(true), []);

	const closeModal = useCallback(() => {
		reset();
		setOpen(false);
		onExternalClose?.();
	}, [reset, onExternalClose]);

	const submit = useCallback(
		async (data: FormValues) => {
			const newProps: ClientArticleProps = {
				...item,
				title: data.title,
				fileName: data.fileName,
			} as ClientArticleProps;

			const response = await FetchService.fetch(
				apiUrlCreator.updateItemProps(),
				JSON.stringify(newProps),
				MimeTypes.json,
			);

			const { pathname } = await response.json();
			updateNavigation(pathname);

			itemLink.title = data.title;
			setItemLink({ ...itemLink });

			const editor = EditorService.getEditor();
			if (editor && isCurrentItem) {
				const header = editor.view.dom.firstChild as HTMLParagraphElement;
				if (header) header.innerText = data.title;
			}

			closeModal();
		},
		[updateNavigation, closeModal],
	);

	useEffect(() => {
		if (!watchTitle) return;
		if (!NEW_ARTICLE_REGEX.test(item?.fileName)) return;

		const newFileName = uniqueName(transliterate(watchTitle, { kebab: true, maxLength: 50 }), brotherFileNames);

		setGeneratedFileName(newFileName);
		setValue("fileName", newFileName, { shouldValidate: true, shouldDirty: true });
	}, [watchTitle]);

	return {
		open,
		setOpen,
		form,
		formState,
		handleSubmit,
		submit,
		isOnlyTitleChanged,
		generatedFileName,
		openModal,
		closeModal,
		catalogProps: CatalogPropsService.value,
	} as const;
};
