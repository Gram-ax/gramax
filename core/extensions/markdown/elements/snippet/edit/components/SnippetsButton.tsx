import Divider from "@components/Atoms/Divider";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import TooltipListLayout from "@components/List/TooltipListLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import LinkItemSidebar from "@ext/article/LinkCreator/components/LinkItemSidebar";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import SnippetListElement from "@ext/markdown/elements/snippet/edit/components/SnippetListElement";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";
import { Editor } from "@tiptap/core";
import { useState } from "react";

interface SnippetsButtonProps {
	editor: Editor;
	onClose?: () => void;
}

const SnippetsButton = ({ editor, onClose }: SnippetsButtonProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [snippetsList, setSnippetsList] = useState<ProviderItemProps[]>([]);
	const snippetText = t("snippet");

	const getSnippets = async () => {
		const res = await FetchService.fetch<ProviderItemProps[]>(apiUrlCreator.getArticleListInGramaxDir("snippet"));
		if (!res.ok) return;
		const snippets = await res.json();

		if (JSON.stringify(snippets) !== JSON.stringify(snippetsList)) {
			setSnippetsList(snippets);
		}
	};

	const itemClickHandler = async (_, __, idx) => {
		onClose();
		const res = await FetchService.fetch<SnippetRenderData>(
			apiUrlCreator.getSnippetRenderData(snippetsList[idx].id),
		);
		if (!res.ok) return;

		const data = await res.json();
		editor.chain().setSnippet(data).focus(editor.state.selection.anchor).run();
	};

	const openSnippetTab = () => {
		NavigationTabsService.setTop(LeftNavigationTab.Snippets);
	};

	const onEditClick = (snippet: ProviderItemProps) => {
		SnippetService.openItem(snippet);
	};

	const buttons = [
		{
			element: (
				<div style={{ width: "100%" }} data-qa="qa-clickable">
					<LinkItemSidebar title={t("add-new-snippet")} iconCode={"plus"} />
					<Divider
						style={{
							background: "var(--color-edit-menu-button-active-bg)",
						}}
					/>
				</div>
			),
			labelField: "addNewSnippet",
			onClick: async () => {
				openSnippetTab();
				const newSnippet = await SnippetService.addNewSnippet(apiUrlCreator);
				SnippetService.openItem(newSnippet);
				onClose();
			},
		},
	];

	return (
		<TooltipListLayout
			action="snippet"
			buttonIcon="sticky-note"
			tooltipText={snippetText}
			onShow={getSnippets}
			buttons={buttons}
			items={snippetsList.map((s) => ({
				labelField: s.title,
				element: <SnippetListElement snippet={s} onEditClick={onEditClick} />,
			}))}
			onItemClick={itemClickHandler}
		/>
	);
};

export default SnippetsButton;
