import { NEW_ARTICLE_REGEX } from "@app/config/const";
import { classNames } from "@components/libs/classNames";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData, ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import EditorService, { BaseEditorContext } from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import { Editor } from "@tiptap/core";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import Renderer from "../../extensions/markdown/core/render/components/Renderer";
import getComponents from "../../extensions/markdown/core/render/components/getComponents/getComponents";
import Header from "../../extensions/markdown/elements/heading/render/component/Header";
import ArticleUpdater from "./ArticleUpdater/ArticleUpdater";

interface ArticleRendererProps {
	data: ArticlePageData;
}

const ArticleParent = ({ children }: { children: React.ReactNode }) => {
	return <div className={classNames("article-body")}>{children}</div>;
};

export const ArticleEditRenderer = (props: ArticleRendererProps) => {
	const { data } = props;

	const onLoadResource = OnLoadResourceService.value;
	const [actualData, setActualData] = useState(data);

	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;

	const apiUrlCreatorRef = useRef(apiUrlCreator);
	const articlePropsRef = useRef(articleProps);
	const editorUpdateContent = EditorService.createOnUpdateCallback();
	const editorHandlePaste = EditorService.createHandlePasteCallback(onLoadResource);

	useWatch(() => {
		apiUrlCreatorRef.current = apiUrlCreator;
		articlePropsRef.current = articleProps;
	}, [apiUrlCreator, articleProps]);

	useEffect(() => {
		setActualData(data);
	}, [data]);

	const onUpdate = (newData: ArticlePageData) => {
		setActualData(newData);
		ArticlePropsService.set(newData.articleProps);
	};

	const updateContent = useCallback(async (editor: Editor) => {
		await editorUpdateContent({
			editor,
			apiUrlCreator: apiUrlCreatorRef.current,
			articleProps: articlePropsRef.current,
		});
	}, []);

	const updateTitle = useCallback(
		async (title: string, articleProps: ClientArticleProps, fileName?: string) => {
			articleProps.title = title;
			articleProps.fileName = fileName ? fileName : articleProps.fileName;

			const url = apiUrlCreatorRef.current.updateItemProps();
			const res = await FetchService.fetch(url, JSON.stringify(articleProps), MimeTypes.json);

			if (fileName && res.ok) {
				const { pathname, ref } = await res.json();
				articleProps.ref = ref;
				pathname && router.pushPath(pathname);
			}
		},
		[router],
	);

	const { start: debouncedUpdateContent, cancel: cancelDebouncedUpdateContent } = useDebounce(updateContent, 500);

	const { start: debouncedUpdateTitle, cancel: cancelDebouncedUpdateTitle } = useDebounce(
		async (newTitle: string, fileName?: string) => {
			const articleProps = articlePropsRef.current;
			await updateTitle(newTitle, articleProps, fileName);
		},
		500,
	);

	useEffect(() => {
		return () => {
			window.forceSave = null;
			cancelDebouncedUpdateContent();
			cancelDebouncedUpdateTitle();
		};
	}, [cancelDebouncedUpdateContent, cancelDebouncedUpdateTitle, apiUrlCreator, actualData.articleProps]);

	const onTitleNeedsUpdate = useCallback(
		({ newTitle, articleProps }: { newTitle: string } & BaseEditorContext) => {
			const maybeKebabName =
				newTitle && NEW_ARTICLE_REGEX.test(articleProps.fileName)
					? transliterate(newTitle, { kebab: true, maxLength: 50 })
					: undefined;

			if (maybeKebabName || newTitle !== articleProps.title) updateTitle(newTitle, articleProps, maybeKebabName);
		},
		[updateTitle, articleProps],
	);

	const onContentUpdate = ({ editor }: { editor: Editor }) => {
		const tocItems = getTocItems(getLevelTocItemsByJSONContent(editor.state.doc));
		if (tocItems) ArticlePropsService.tocItems = tocItems;

		typeof window !== "undefined" && (window.forceSave = () => updateContent(editor));

		debouncedUpdateContent(editor);
		if (articleProps.title !== editor.state.doc.firstChild.textContent) {
			debouncedUpdateTitle(editor.state.doc.firstChild.textContent);
		}
	};

	return (
		<ArticleUpdater data={actualData} onUpdate={onUpdate}>
			<ArticleParent>
				<ContentEditor
					content={actualData.articleContentEdit}
					extensions={getExtensions()}
					onTitleLoseFocus={onTitleNeedsUpdate}
					onUpdate={onContentUpdate}
					handlePaste={editorHandlePaste}
				/>
			</ArticleParent>
		</ArticleUpdater>
	);
};

export const ArticleReadRenderer = memo(({ data }: { data: ArticlePageData }) => {
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
});
