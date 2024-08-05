import Divider from "@components/Atoms/Divider";
import TooltipListLayout from "@components/List/TooltipListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import LinkItemSidebar from "@ext/artilce/LinkCreator/components/LinkItemSidebar";
import t from "@ext/localization/locale/translate";
import SnippetEditor from "@ext/markdown/elements/snippet/edit/components/SnippetEditor";
import SnippetListElement from "@ext/markdown/elements/snippet/edit/components/SnippetListElement";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";
import SnippetRenderData from "@ext/markdown/elements/snippet/model/SnippetRenderData";
import { Editor } from "@tiptap/core";
import { ComponentProps, useState } from "react";

interface SnippetsButtonProps {
	editor: Editor;
	onClose?: () => void;
}

const SnippetsButton = ({ editor, onClose }: SnippetsButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [snippetsList, setSnippetsList] = useState<SnippetEditorProps[]>([]);
	const snippetText = t("snippet");
	const addNewSnippetText = t("add-new-snippet");

	const getSnippets = async () => {
		const res = await FetchService.fetch<SnippetEditorProps[]>(apiUrlCreator.getSnippetsListData());
		if (!res.ok) return;
		const snippets = await res.json();
		if (JSON.stringify(snippets) !== JSON.stringify(snippetsList)) {
			setSnippetsList(snippets);
		}
	};

	const createSnippet = async (snippetData: SnippetEditData) => {
		await FetchService.fetch(apiUrlCreator.createSnippet(), JSON.stringify(snippetData), MimeTypes.json);

		const res = await FetchService.fetch<SnippetRenderData>(apiUrlCreator.getSnippetRenderData(snippetData.id));
		if (!res.ok) return;

		const data = await res.json();
		const focusBefore = editor.state.selection.anchor;
		editor.commands.setSnippet(data);
		editor.commands.focus(focusBefore);
	};

	const focusEditor = () => {
		editor.commands.focus(editor.state.selection.anchor);
	};

	const buttons = [
		{
			element: (
				<div style={{ width: "100%" }} data-qa="qa-clickable">
					{<LinkItemSidebar title={addNewSnippetText} iconCode={"plus"} />}
					<Divider
						style={{
							background: "var(--color-edit-menu-button-active-bg)",
						}}
					/>
				</div>
			),
			labelField: "addNewSnippet",
			onClick: () => {
				ModalToOpenService.setValue<ComponentProps<typeof SnippetEditor>>(ModalToOpen.SnippetEditor, {
					type: "create",
					snippetsListIds: snippetsList.map((s) => s.id),
					onSave: createSnippet,
					onClose: () => {
						focusEditor();
						if (ModalToOpenService.value === ModalToOpen.SnippetEditor) ModalToOpenService.resetValue();
					},
				});
				onClose();
			},
		},
	];

	const itemClickHandler = async (_, __, idx) => {
		onClose();
		const res = await FetchService.fetch<SnippetRenderData>(
			apiUrlCreator.getSnippetRenderData(snippetsList[idx].id),
		);
		if (!res.ok) return;

		const data = await res.json();
		editor.commands.setSnippet(data);
		focusEditor();
	};

	return (
		<TooltipListLayout
			action="snippet"
			buttonIcon="sticky-note"
			tooltipText={snippetText}
			onShow={getSnippets}
			buttons={buttons}
			items={snippetsList.map((s) => ({
				labelField: s.title,
				element: <SnippetListElement snippet={s} onEditClick={onClose} onClose={focusEditor} />,
			}))}
			onItemClick={itemClickHandler}
		/>
	);
};

export default SnippetsButton;
