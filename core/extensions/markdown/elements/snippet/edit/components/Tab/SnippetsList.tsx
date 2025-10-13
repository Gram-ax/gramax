import Icon from "@components/Atoms/Icon";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ItemList from "@ext/articleProvider/components/ItemList";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import { SnippetAlreadyUseWarnProps } from "@ext/markdown/elements/snippet/edit/components/SnippetAlreadyUseWarn";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import SnippetUsages from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetUsages";
import { RefObject, useCallback, useEffect } from "react";

interface SnippetsListProps {
	apiUrlCreator: ApiUrlCreator;
	snippets: Map<string, ProviderItemProps>;
	selectedID: string;
	show: boolean;
	tabWrapperRef: RefObject<HTMLDivElement>;
	setHeight: (height: number) => void;
}

const SnippetsList = ({ show, snippets, selectedID, apiUrlCreator, tabWrapperRef, setHeight }: SnippetsListProps) => {
	useEffect(() => {
		if (!show) return;

		SnippetService.fetchItems(apiUrlCreator);
	}, [show]);

	const onDelete = useCallback(
		(id: string) => {
			if (selectedID === id) {
				void FetchService.fetch(apiUrlCreator.clearArticlesContentWithSnippet(id));
				SnippetService.closeItem();
			}

			const newSnippets = Array.from(snippets.values()).filter((s) => s.id !== id);
			SnippetService.setItems(newSnippets);
			SnippetUpdateService.clearContent(id);
		},
		[selectedID, snippets, apiUrlCreator],
	);

	const onMarkdownChange = useCallback(
		async (id: string) => {
			await SnippetUpdateService.updateContent(id, apiUrlCreator);

			if (selectedID === id) {
				SnippetService.closeItem();

				setTimeout(() => {
					SnippetService.openItem(snippets.get(id));
				}, 0);
			}
		},
		[selectedID, snippets, apiUrlCreator],
	);

	const onItemClick = useCallback(
		(id: string) => {
			const snippet = snippets.get(id);
			if (!snippet) return;

			SnippetService.openItem(snippet);
		},
		[snippets],
	);

	const rightActions = useCallback((id: string) => {
		return (
			<SnippetUsages
				isSubmenu
				snippetId={id}
				trigger={
					<>
						<Icon code="file-symlink" />
						{t("view-usage")}
					</>
				}
			/>
		);
	}, []);

	const preDelete = useCallback(async (id: string) => {
		return new Promise<boolean>((resolve) => {
			ModalToOpenService.setValue<SnippetAlreadyUseWarnProps>(ModalToOpen.SnippetAlreadyUseWarn, {
				snippetId: id,
				onClose: () => {
					resolve(false);
					ModalToOpenService.resetValue();
				},
				onSubmit: () => {
					resolve(true);
					ModalToOpenService.resetValue();
				},
			});
		});
	}, []);

	return (
		<ItemList
			show={show}
			tabWrapperRef={tabWrapperRef}
			setContentHeight={setHeight}
			providerType="snippet"
			items={Array.from(snippets.values())}
			selectedItemId={selectedID}
			onDelete={onDelete}
			noItemsText={t("no-snippets")}
			onMarkdownChange={onMarkdownChange}
			onItemClick={onItemClick}
			rightActions={rightActions}
			preDelete={preDelete}
		/>
	);
};

export default SnippetsList;
