import { NEW_ARTICLE_REGEX } from "@app/config/const";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import debounceFunction from "@core-ui/debounceFunction";
import { useCtrlKeyLinkHandler } from "@core-ui/hooks/useCtrlKeyLinkHandler";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { pasteArticleResource } from "@ext/markdown/elements/copyArticles/copyPasteArticleResource";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import FocusService from "@ext/markdown/elementsUtils/ContextServices/FocusService";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import { Editor } from "@tiptap/core";
import { EditorView } from "prosemirror-view";
import { useEffect, useState } from "react";
import ArticleRenderer from "./ArticleRenderer";
import ArticleUpdater from "./ArticleUpdater/ArticleUpdater";

const ARTICLE_UPDATE_SYMBOL = Symbol();
const ARTICLE_TITLE_UPDATE_SYMBOL = Symbol();

const Article = ({ data }: { data: ArticlePageData }) => {
	const router = useRouter();
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [actualData, setActualData] = useState(data);

	useCtrlKeyLinkHandler(); // Для открытия ссылок в tauri
	useScrollToArticleAnchor(data); // Для скрола до заголовка в статье

	useEffect(() => {
		setActualData(data);
	}, [data]);

	const onUpdate = (newData: ArticlePageData) => {
		setActualData(newData);
		ArticlePropsService.set(newData.articleProps);
	};

	const onTitleUpdate = async (title: string, fileName?: string) => {
		articleProps.title = title;
		articleProps.fileName = fileName ? fileName : articleProps.fileName;
		ArticlePropsService.set(articleProps);

		const url = apiUrlCreator.updateItemProps();
		const res = await FetchService.fetch(url, JSON.stringify(articleProps), MimeTypes.json);

		if (fileName && res.ok) {
			const pathname = await res.text();
			pathname && router.pushPath(pathname);
		}
	};

	const titleUpdate = ({ newTitle }: { newTitle: string }) => {
		const maybeKebabName =
			newTitle && NEW_ARTICLE_REGEX.test(articleProps.fileName)
				? transliterate(newTitle, { kebab: true, maxLength: 50 })
				: undefined;

		if (maybeKebabName) onTitleUpdate(newTitle, maybeKebabName);
	};

	const handleUpdate = ({ editor }: { editor: Editor }) => {
		const beforeHeaderText = articleProps.title;
		const afterHeaderText = editor.state.doc.firstChild.textContent;

		onContentUpdate({ editor });

		if (beforeHeaderText !== afterHeaderText)
			debounceFunction(ARTICLE_TITLE_UPDATE_SYMBOL, () => onTitleUpdate(afterHeaderText), 500);
	};

	const handlePaste = (view: EditorView, event: ClipboardEvent) => {
		if (event.clipboardData.files.length !== 0) return imageHandlePaste(view, event, articleProps, apiUrlCreator);

		return pasteArticleResource({ view, event, articleProps, apiUrlCreator });
	};

	const onBlur = ({ editor }: { editor: Editor }) => {
		titleUpdate({ newTitle: editor.state.doc.firstChild.textContent });
	};

	const onContentUpdate = ({ editor }: { editor: Editor }) => {
		const f = async () => {
			const json = editor.getJSON();
			json.content.shift();
			const articleContentEdit = JSON.stringify(json);
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
			<ArticleRenderer
				data={actualData}
				handlePaste={handlePaste}
				onBlur={onBlur}
				onTitleLoseFocus={titleUpdate}
				onUpdate={handleUpdate.bind(this)}
				onSelectionUpdate={onSelectionUpdate}
			/>
		</ArticleUpdater>
	);
};

export default Article;
