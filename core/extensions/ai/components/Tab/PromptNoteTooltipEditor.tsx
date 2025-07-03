import PromptService from "@ext/ai/components/Tab/PromptService";
import TooltipArticleView, { TooltipEditorProps } from "@ext/articleProvider/components/TooltipArticleView";
import PopoverUtility from "@ext/articleProvider/logic/PopoverUtility";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import { JSONContent } from "@tiptap/react";
import { useCallback } from "react";

interface PromptNoteTooltipEditorProps extends TooltipEditorProps {
	selectedIds: string[];
	items: ProviderItemProps[];
}

const Tooltip = ({ item, ...rest }: PromptNoteTooltipEditorProps) => {
	const { selectedIds, items } = PromptService.value;

	const onOutsideClick = useCallback(() => {
		const newPaths = PopoverUtility.removeSelectedIds(selectedIds, item.id);
		PromptService.setSelectedIds(newPaths);
		PromptService.closeNote(item.id);
	}, [selectedIds, item]);

	const onUpdate = useCallback(
		(id: string, content: JSONContent, title: string) => {
			if (!selectedIds.includes(id)) return;
			const selectedIndex = items.findIndex((note) => note.id === id);
			const selectedNote = items[selectedIndex];

			if (!selectedNote) return;
			if (selectedNote.title !== title) {
				selectedNote.title = title;
			}

			const newItems = [...items.slice(0, selectedIndex), selectedNote, ...items.slice(selectedIndex + 1)];
			PromptService.setItems(newItems);
		},
		[items, selectedIds],
	);

	const onClose = useCallback(() => {
		PromptService.closeNote(item.id);

		const newSelectedIds = PopoverUtility.removeSelectedIds(selectedIds, item.id);
		PromptService.setSelectedIds(newSelectedIds);
	}, [item, selectedIds]);

	return (
		<TooltipArticleView
			articleType="prompt"
			onUpdate={onUpdate}
			onClose={onClose}
			selectedIds={selectedIds}
			onOutsideClick={onOutsideClick}
			item={item}
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
			{...rest}
		/>
	);
};

const PromptNoteTooltipEditor = ({ selectedIds, items, item, ...rest }: PromptNoteTooltipEditorProps) => {
	return (
		<PromptService.Context value={{ selectedIds, items }}>
			<Tooltip selectedIds={selectedIds} items={items} item={item} {...rest} />
		</PromptService.Context>
	);
};

export default PromptNoteTooltipEditor;
