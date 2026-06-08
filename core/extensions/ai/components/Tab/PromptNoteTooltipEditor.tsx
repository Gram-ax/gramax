import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { promptStore, usePromptStore } from "@ext/ai/components/Tab/PromptStore";
import TooltipArticleView, { type TooltipEditorProps } from "@ext/articleProvider/components/TooltipArticleView";
import PopoverUtility from "@ext/articleProvider/logic/PopoverUtility";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import type { JSONContent } from "@tiptap/react";
import { useCallback } from "react";

interface PromptNoteTooltipEditorProps extends TooltipEditorProps {
	selectedIds: string[];
	items: ProviderItemProps[];
}

const Tooltip = ({ item, ...rest }: PromptNoteTooltipEditorProps) => {
	const { selectedIds, items } = usePromptStore((s) => ({ selectedIds: s.selectedIds, items: s.items }), "shallow");

	const onOutsideClick = useCallback(() => {
		const newPaths = PopoverUtility.removeSelectedIds(selectedIds, item.id);
		promptStore.getState().setSelectedIds(newPaths);
		promptStore.getState().closeNote(item.id);
	}, [selectedIds, item]);

	const onUpdate = useCallback(
		(id: string, _content: JSONContent, title: string) => {
			if (!selectedIds.includes(id)) return;
			const selectedIndex = items.findIndex((note) => note.id === id);
			const selectedNote = items[selectedIndex];

			if (!selectedNote) return;
			if (selectedNote.title !== title) {
				selectedNote.title = title;
			}

			const newItems = [...items.slice(0, selectedIndex), selectedNote, ...items.slice(selectedIndex + 1)];
			promptStore.getState().setItems(newItems);
		},
		[items, selectedIds],
	);

	const onClose = useCallback(() => {
		promptStore.getState().closeNote(item.id);

		const newSelectedIds = PopoverUtility.removeSelectedIds(selectedIds, item.id);
		promptStore.getState().setSelectedIds(newSelectedIds);
	}, [item, selectedIds]);

	return (
		<TooltipArticleView
			articleType="prompt"
			extensions={[
				Placeholder.configure({
					placeholder: ({ editor, node }) => {
						if (
							editor.state.doc.firstChild.type.name === "paragraph" &&
							editor.state.doc.firstChild === node
						)
							return t("ai.prompt.placeholder.title");

						if (
							node.type.name === "paragraph" &&
							editor.state.doc.content.child(1) === node &&
							editor.state.doc.content.childCount === 2
						)
							return t("ai.prompt.placeholder.content");
					},
				}),
			]}
			item={item}
			onClose={onClose}
			onOutsideClick={onOutsideClick}
			onUpdate={onUpdate}
			selectedIds={selectedIds}
			{...rest}
		/>
	);
};

const PromptNoteTooltipEditor = ({ item, ...rest }: PromptNoteTooltipEditorProps) => {
	const pageDataContext = usePromptStore((s) => s.pageDataContext);
	const catalogProps = usePromptStore((s) => s.catalogProps);

	return (
		<PageDataContextService.Provider value={pageDataContext}>
			<CatalogStoreProvider data={catalogProps}>
				<Tooltip item={item} {...rest} />
			</CatalogStoreProvider>
		</PageDataContextService.Provider>
	);
};

export default PromptNoteTooltipEditor;
