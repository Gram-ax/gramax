import { NEW_ARTICLE_REGEX } from "@app/config/const";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import debounceFunction from "@core-ui/debounceFunction";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import getIsDevMode from "@core-ui/utils/getIsDevMode";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData, ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import { pasteArticleResource } from "@ext/markdown/elements/copyArticles/copyPasteArticleResource";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import {
	BaseEditorContext,
	EditorContext,
	EditorPasteHandler,
} from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import { Editor } from "@tiptap/core";
import { useEffect, useMemo, useState } from "react";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import Renderer from "../../extensions/markdown/core/render/components/Renderer";
import getComponents from "../../extensions/markdown/core/render/components/getComponents/getComponents";
import Header from "../../extensions/markdown/elements/heading/render/component/Header";
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
	const onLoadResource = OnLoadResourceService.value;
	const [actualData, setActualData] = useState(data);

	const articleProps = ArticlePropsService.value;

	useEffect(() => {
		setActualData(data);
	}, [data]);

	const onUpdate = (newData: ArticlePageData) => {
		setActualData(newData);
		ArticlePropsService.set(newData.articleProps);
	};

	const onTitleUpdate = async (
		title: string,
		apiUrlCreator: ApiUrlCreator,
		articleProps: ClientArticleProps,
		fileName?: string,
	) => {
		articleProps.title = title;
		articleProps.fileName = fileName ? fileName : articleProps.fileName;

		const url = apiUrlCreator.updateItemProps();
		const res = await FetchService.fetch(url, JSON.stringify(articleProps), MimeTypes.json);
		if (fileName && res.ok) {
			const { pathname } = await res.json();
			pathname && router.pushPath(pathname);
		}
	};

	const titleUpdate = ({ newTitle, apiUrlCreator, articleProps }: { newTitle: string } & BaseEditorContext) => {
		const maybeKebabName =
			newTitle && NEW_ARTICLE_REGEX.test(articleProps.fileName)
				? transliterate(newTitle, { kebab: true, maxLength: 50 })
				: undefined;

		if (maybeKebabName) onTitleUpdate(newTitle, apiUrlCreator, articleProps, maybeKebabName);
	};

	const handleUpdate = ({ editor, apiUrlCreator, articleProps }: EditorContext) => {
		const beforeHeaderText = articleProps.title;
		const afterHeaderText = editor.state.doc.firstChild.textContent;
		onContentUpdate({ editor, apiUrlCreator });

		if (beforeHeaderText !== afterHeaderText)
			debounceFunction(
				ARTICLE_TITLE_UPDATE_SYMBOL,
				() => onTitleUpdate(afterHeaderText, apiUrlCreator, articleProps),
				500,
			);
	};

	const handlePaste: EditorPasteHandler = (view, event, _slice, apiUrlCreator, articleProps) => {
		if (!event.clipboardData) return false;
		if (event.clipboardData.files.length !== 0)
			return imageHandlePaste(view, event, articleProps, apiUrlCreator, onLoadResource);

		return pasteArticleResource({ view, event, articleProps, apiUrlCreator, onLoadResource });
	};

	const onBlur = ({ editor, apiUrlCreator, articleProps }: EditorContext) => {
		titleUpdate({ newTitle: editor.state.doc.firstChild.textContent, apiUrlCreator, articleProps });
	};

	const onContentUpdate = ({ editor, apiUrlCreator }: { editor: Editor; apiUrlCreator: ApiUrlCreator }) => {
		const f = async () => {
			const json = editor.getJSON();
			json.content.shift();
			const articleContentEdit = JSON.stringify(json);
			const url = apiUrlCreator.updateArticleContent();
			const res = await FetchService.fetch(url, articleContentEdit, MimeTypes.json);
			if (res.ok && getIsDevMode()) {
				const data = await res.json();
				articleProps.status = data?.status;
				ArticlePropsService.set(articleProps);
			}
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
