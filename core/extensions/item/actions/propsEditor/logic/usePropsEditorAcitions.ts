import { useRouter } from "@core/Api/useRouter";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import useWatch from "@core-ui/hooks/useWatch";
import type PropsEditor from "@ext/item/actions/propsEditor/components/PropsEditor";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import type { QuizSettings } from "@ext/quiz/models/types";
import { type ComponentProps, type Dispatch, type SetStateAction, useCallback, useState } from "react";

export interface UsePropsEditorActionsParams {
	item: ClientArticleProps;
	itemLink: ItemLink;
	setItemLink: Dispatch<SetStateAction<ItemLink>>;
	isCategory: boolean;
	onUpdate?: () => void;
	onExternalClose?: () => void;
}

export interface PropsEditorData {
	title: string;
	fileName: string;
	quiz?: QuizSettings;
	searchPhrases?: string[];
}

export const usePropsEditorActions = (params: UsePropsEditorActionsParams) => {
	const { item, itemLink, setItemLink, onExternalClose, isCategory, onUpdate } = params;

	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;
	const isCurrentItem = item.ref.path === articleProps.ref.path;
	const router = useRouter();

	const domain = PageDataContextService.value.domain;
	const [parentCategoryLink, setParentCategoryLink] = useState<string>(domain);

	useWatch(() => {
		setParentCategoryLink(domain + "/" + item?.logicPath.replace(/[^/]*$/, ""));
	}, [item]);

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

	const closeModal = useCallback(() => {
		ModalToOpenService.resetValue();
		onExternalClose?.();
	}, [onExternalClose]);

	const submit = useCallback(
		async (data: PropsEditorData) => {
			const newProps: ClientArticleProps = {
				...item,
				title: data.title,
				fileName: data.fileName,
				quiz: data.quiz,
				searchPhrases: data.searchPhrases,
			} as ClientArticleProps;

			const response = await FetchService.fetch(
				apiUrlCreator.updateItemProps(),
				JSON.stringify(newProps),
				MimeTypes.json,
			);

			if (!response.ok) return;

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
			onUpdate?.();
		},
		[updateNavigation, closeModal, onUpdate],
	);

	const openModal = useCallback(() => {
		ModalToOpenService.setValue<ComponentProps<typeof PropsEditor>>(ModalToOpen.ItemPropsEditor, {
			item,
			itemLink,
			setItemLink,
			isCurrentItem,
			submit,
			onClose: closeModal,
			isCategory,
		});
	}, [item, itemLink, setItemLink, isCurrentItem, isCategory, submit]);

	return {
		submit,
		openModal,
		parentCategoryLink,
		closeModal,
	} as const;
};
