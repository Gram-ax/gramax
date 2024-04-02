import ModalLoading from "@components/ModalLoading";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SnippetAlreadyUseWarn from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import SnippetEditor from "@ext/markdown/elements/snippet/edit/components/SnippetEditor";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";
import { ComponentProps } from "react";

const setModalLoading = () => {
	ModalToOpenService.setValue<ComponentProps<typeof ModalLoading>>(ModalToOpen.Loading, {
		onClose: () => {
			if (ModalToOpenService.value === ModalToOpen.Loading) ModalToOpenService.resetValue();
		},
	});
};

const getOnSave = (apiUrlCreator: ApiUrlCreator, snippetId: string) => {
	return async (data: SnippetEditData) => {
		await FetchService.fetch(apiUrlCreator.editSnippet(snippetId), JSON.stringify(data), MimeTypes.json);
		await SnippetUpdateService.updateContent(snippetId, apiUrlCreator);
	};
};

const getOnDelete = (
	data: SnippetEditData,
	apiUrlCreator: ApiUrlCreator,
	snippetId: string,
	snippetDeleteConfirmText: string,
) => {
	return async () => {
		const onDelete = async () => {
			setModalLoading();
			await FetchService.fetch(apiUrlCreator.removeSnippet(snippetId));
		};

		setModalLoading();

		const res = await FetchService.fetch<{ pathname: string; title: string }[]>(
			apiUrlCreator.getArticlesWithSnippet(snippetId),
		);
		if (!res.ok) {
			ModalToOpenService.resetValue();
			return;
		}

		const articles = await res.json();
		if (articles?.length === 0) {
			if (await confirm(snippetDeleteConfirmText)) {
				await onDelete();
				ModalToOpenService.resetValue();
			} else setSnippetEditor(data, apiUrlCreator, snippetId, snippetDeleteConfirmText);
			return;
		}

		ModalToOpenService.setValue<ComponentProps<typeof SnippetAlreadyUseWarn>>(ModalToOpen.SnippetAlreadyUseWarn, {
			articles,
			onDelete: async () => {
				await onDelete();
				ModalToOpenService.resetValue();
			},
			onClose: () => {
				if (ModalToOpenService.value === ModalToOpen.SnippetAlreadyUseWarn) ModalToOpenService.resetValue();
			},
		});
	};
};

const setSnippetEditor = (
	data: SnippetEditData,
	apiUrlCreator: ApiUrlCreator,
	snippetId: string,
	snippetDeleteConfirmText: string,
) => {
	ModalToOpenService.setValue<ComponentProps<typeof SnippetEditor>>(ModalToOpen.SnippetEditor, {
		type: "edit",
		snippetData: data,
		onClose: () => {
			if (ModalToOpenService.value === ModalToOpen.SnippetEditor) ModalToOpenService.resetValue();
		},
		onSave: getOnSave(apiUrlCreator, snippetId),
		onDelete: getOnDelete(data, apiUrlCreator, snippetId, snippetDeleteConfirmText),
	});
};

const onSnippetEdit = async (
	snippetId: string,
	apiUrlCreator: ApiUrlCreator,
	snippetDeleteConfirmText: string,
	onStartFetch?: () => void,
	onStopFetch?: () => void,
) => {
	onStartFetch?.();
	const res = await FetchService.fetch<SnippetEditData>(apiUrlCreator.getSnippetEditData(snippetId));
	onStopFetch?.();
	if (!res.ok) return;
	const data = await res.json();

	setSnippetEditor(data, apiUrlCreator, snippetId, snippetDeleteConfirmText);
};

export default onSnippetEdit;
