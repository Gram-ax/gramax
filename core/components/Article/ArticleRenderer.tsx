import { classNames } from "@components/libs/classNames";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import { Editor } from "@tiptap/core";
import { EditorView } from "prosemirror-view";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import Renderer from "../../extensions/markdown/core/render/components/Renderer";
import getComponents from "../../extensions/markdown/core/render/components/getComponents/getComponents";
import Header from "../../extensions/markdown/elements/heading/render/component/Header";
import { NEW_ARTICLE_REGEX } from "@app/config/const";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import debounceFunction from "@core-ui/debounceFunction";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { useRouter } from "@core/Api/useRouter";
import { pasteArticleResource } from "@ext/markdown/elements/copyArticles/copyPasteArticleResource";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import { useEffect, useMemo, useState } from "react";
import ArticleUpdater from "./ArticleUpdater/ArticleUpdater";

const ARTICLE_UPDATE_SYMBOL = Symbol();
const ARTICLE_TITLE_UPDATE_SYMBOL = Symbol();

interface ArticleRendererProps {
	data: ArticlePageData;
}

const ArticleParent = ({ children }: { children: React.ReactNode }) => {
	return <div className={classNames("article-body")}>{children}</div>;
};

export const ArticleEditRenderer = (props: ArticleRendererProps) => {
	const { data } = props;

	const router = useRouter();
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [actualData, setActualData] = useState(data);

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
		if (!event.clipboardData) return false;
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

	return (
		<ArticleUpdater data={actualData} onUpdate={onUpdate}>
			<ArticleParent>
				<ContentEditor
					content={actualData.articleContentEdit}
					extensions={getExtensions()}
					onBlur={onBlur}
					onTitleLoseFocus={titleUpdate}
					onUpdate={handleUpdate.bind(this)}
					handlePaste={handlePaste}
				/>
			</ArticleParent>
		</ArticleUpdater>
	);
};

export const ArticleReadRenderer = ({ data }: { data: ArticlePageData }) => {
	const { articleProps } = data;
	return (
		<ArticleParent>
			<>
				<Header level={1} className={"article-title"} dataQa={"article-title"}>
					{articleProps.title}
				</Header>
				{!articleProps.description ? null : (
					<Header level={2} className={"article-description"} dataQa={"article-description"}>
						{articleProps.description}
					</Header>
				)}
				{typeof window == "undefined"
					? data.markdown
					: Renderer(JSON.parse(data.articleContentRender), { components: useMemo(getComponents, []) })}
				<ArticleMat />
			</>
		</ArticleParent>
	);
};
