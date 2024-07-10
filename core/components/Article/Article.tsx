import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import debounceFunction from "@core-ui/debounceFunction";
import { useCtrlKeyLinkHandler } from "@core-ui/hooks/useCtrlKeyLinkHandler";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import FocusService from "@ext/markdown/elementsUtils/ContextServices/FocusService";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";
import ArticleRenderer from "./ArticleRenderer";
import ArticleTitle from "./ArticleTitle";
import ArticleUpdater from "./ArticleUpdater/ArticleUpdater";
import { EditorView } from "prosemirror-view";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import { pasteArticleResource } from "@ext/markdown/elements/copyArticles/copyPasteArticleResource";

const ARTICLE_UPDATE_SYMBOL = Symbol();

const Article = ({ data }: { data: ArticlePageData }) => {
	// const articleRef = ArticleRefService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [actualData, setActualData] = useState(data);
	// const [scrollPosition, setScrollPosition] = useState(0);

	useCtrlKeyLinkHandler(); // Для открытия ссылок в tauri

	useScrollToArticleAnchor(data); // Для скрола до заголовка в статье

	useEffect(() => {
		setActualData(data);
		ArticlePropsService.set(data.articleProps);
	}, [data]);

	const onUpdate = (newData: ArticlePageData) => {
		setActualData(newData);
		// setScrollPosition(articleRef?.current?.scrollTop ?? 0);
		ArticlePropsService.set(newData.articleProps);
	};

	const onCreate = () => {
		// if (!articleRef?.current) return;
		// setTimeout(() => articleRef.current?.scrollTo({ top: scrollPosition, behavior: "auto" }), 50);
	};

	const handlePaste = (view: EditorView, event: ClipboardEvent) => {
		if (event.clipboardData.files.length !== 0) return imageHandlePaste(view, event, articleProps, apiUrlCreator);

		return pasteArticleResource(view, event, articleProps, apiUrlCreator);
	};

	const onBlur = () => {
		// { editor }: { editor: Editor }
		// actualData.articleContentEdit = JSON.stringify(editor.getJSON());
		// setActualData({ ...actualData });
	};

	const onContentUpdate = ({ editor }: { editor: Editor }) => {
		const f = async () => {
			const articleContentEdit = JSON.stringify(editor.getJSON());
			const url = apiUrlCreator.updateArticleContent();
			await FetchService.fetch(url, articleContentEdit, MimeTypes.json);
		};
		window.forceTrollCaller = f;
		debounceFunction(ARTICLE_UPDATE_SYMBOL, f, 500);

		const tocItems = getTocItems(getLevelTocItemsByJSONContent(editor.state.doc));
		if (!tocItems) return;
		ArticlePropsService.tocItems = tocItems;
	};

	const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
		FocusService.setFocusPosition(editor.state.selection.anchor);
	};

	return (
		<ArticleUpdater data={actualData} onUpdate={onUpdate}>
			<>
				<ArticleTitle />
				<ArticleRenderer
					data={actualData}
					onCreate={onCreate}
					handlePaste={handlePaste}
					onBlur={onBlur}
					onUpdate={onContentUpdate.bind(this)}
					onSelectionUpdate={onSelectionUpdate}
				/>
			</>
		</ArticleUpdater>
	);
};

export default Article;
