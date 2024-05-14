import ModalLoading from "@components/ModalLoading";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SnippetAlreadyUseWarn from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import SnippetEditor from "@ext/markdown/elements/snippet/edit/components/SnippetEditor";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";
import { ComponentProps } from "react";

type OnDeleteCallback = (usedInArticles: { pathname: string; title: string }[]) => void | Promise<void>;

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
	snippetsListIds: string[],
	snippetDeleteConfirmText: string,
	onEditorClose?: () => void | Promise<void>,
	onEditorOpen?: () => void | Promise<void>,
	callback?: OnDeleteCallback,
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
				void callback?.(articles);
			} else {
				setSnippetEditor(
					data,
					apiUrlCreator,
					snippetId,
					snippetsListIds,
					snippetDeleteConfirmText,
					articles,
					onEditorClose,
					onEditorOpen,
					callback
				);
			}
			return;
		}

		ModalToOpenService.setValue<ComponentProps<typeof SnippetAlreadyUseWarn>>(ModalToOpen.SnippetAlreadyUseWarn, {
			articles,
			onDelete: async () => {
				await onDelete();
				ModalToOpenService.resetValue();
				void callback?.(articles);
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
	snippetsListIds: string[],
	snippetDeleteConfirmText: string,
	articles?: { pathname: string; title: string }[],
	onClose?: () => void | Promise<void>,
	onOpen?: () => void | Promise<void>,
	onDelete?: OnDeleteCallback,
) => {
	ModalToOpenService.setValue<ComponentProps<typeof SnippetEditor>>(ModalToOpen.SnippetEditor, {
		type: "edit",
		articles,
		snippetsListIds,
		snippetData: data,
		onOpen: onOpen,
		onClose: () => {
			void onClose?.();
			if (ModalToOpenService.value === ModalToOpen.SnippetEditor) ModalToOpenService.resetValue();
		},
		onSave: getOnSave(apiUrlCreator, snippetId),
		onDelete: getOnDelete(
			data,
			apiUrlCreator,
			snippetId,
			snippetsListIds,
			snippetDeleteConfirmText,
			onClose,
			onOpen,
			onDelete,
		),
	});
};

const onSnippetEdit = async ({
	snippetId,
	apiUrlCreator,
	snippetDeleteConfirmText,
	onStartFetch,
	onStopFetch,
	onDelete,
	onClose,
	onOpen,
}: {
	snippetId: string;
	apiUrlCreator: ApiUrlCreator;
	snippetDeleteConfirmText: string;
	onStartFetch?: () => void | Promise<void>;
	onStopFetch?: () => void | Promise<void>;
	onDelete?: OnDeleteCallback;
	onClose?: () => void | Promise<void>;
	onOpen?: () => void | Promise<void>;
}) => {
	void onStartFetch?.();

	const data = await Promise.all([
		FetchService.fetch<SnippetEditData>(apiUrlCreator.getSnippetEditData(snippetId)),
		FetchService.fetch<SnippetEditorProps[]>(apiUrlCreator.getSnippetsListData()),
	]);

	void onStopFetch?.();

	if (data.map((d) => d.ok).includes(false)) return;

	const res = await FetchService.fetch<{ pathname: string; title: string }[]>(
		apiUrlCreator.getArticlesWithSnippet(snippetId),
	);
	const articles = await res.json();

	const snippetData = await data[0].json();
	const snippetsListIds = await data[1].json().then((x) => x.map((x) => x.id));

	setSnippetEditor(
		snippetData,
		apiUrlCreator,
		snippetId,
		snippetsListIds,
		snippetDeleteConfirmText,
		articles,
		onClose,
		onOpen,
		onDelete,
	);
};

export default onSnippetEdit;
