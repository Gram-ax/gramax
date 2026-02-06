import TooltipArticleView, { TooltipEditorProps } from "@ext/articleProvider/components/TooltipArticleView";
import PopoverUtility from "@ext/articleProvider/logic/PopoverUtility";
import InboxService from "@ext/inbox/components/InboxService";
import { InboxArticle } from "@ext/inbox/models/types";
import t from "@ext/localization/locale/translate";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import { JSONContent } from "@tiptap/react";
import { useCallback } from "react";

interface InboxNoteTooltipEditorProps extends TooltipEditorProps {
	selectedIds: string[];
	items: InboxArticle[];
}

const Tooltip = ({ item, ...rest }: InboxNoteTooltipEditorProps) => {
	const { selectedIds, items: items } = InboxService.value;

	const onOutsideClick = useCallback(() => {
		const newPaths = PopoverUtility.removeSelectedIds(selectedIds, item.id);
		InboxService.setSelectedIds(newPaths);
		InboxService.closeNote(item.id);
	}, [selectedIds, item]);

	const onUpdate = useCallback(
		(id: string, content: JSONContent, title: string) => {
			if (!selectedIds.includes(id)) return;
			const selectedNote = items.find((note) => note.id === id);

			if (!selectedNote) return;
			if (selectedNote.title !== title) {
				selectedNote.title = title;
			}

			const newItems = [...items.filter((note) => note.id !== id), selectedNote];
			InboxService.setItems(newItems);
		},
		[items, selectedIds],
	);

	const onClose = useCallback(() => {
		InboxService.closeNote(item.id);

		const newSelectedIds = PopoverUtility.removeSelectedIds(selectedIds, item.id);
		InboxService.setSelectedIds(newSelectedIds);
	}, [item, selectedIds]);

	return (
		<InboxService.Context value={{ selectedIds, items: items }}>
			<TooltipArticleView
				articleType="inbox"
				extensions={[
					Placeholder.configure({
						placeholder: ({ editor, node }) => {
							if (
								editor.state.doc.firstChild.type.name === "paragraph" &&
								editor.state.doc.firstChild === node
							)
								return t("inbox.placeholders.title");

							if (
								node.type.name === "paragraph" &&
								editor.state.doc.content.child(1) === node &&
								editor.state.doc.content.childCount === 2
							)
								return t("inbox.placeholders.content");
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
		</InboxService.Context>
	);
};

const InboxNoteTooltipEditor = ({ selectedIds, items, item, ...rest }: InboxNoteTooltipEditorProps) => {
	return (
		<InboxService.Context value={{ selectedIds, items: items }}>
			<Tooltip item={item} items={items} selectedIds={selectedIds} {...rest} />
		</InboxService.Context>
	);
};

export default InboxNoteTooltipEditor;
