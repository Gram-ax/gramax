import { NEW_ARTICLE_REGEX } from "@app/config/const";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
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

	const resourceService = ResourceService.value;
	const [actualData, setActualData] = useState(data);

	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;

	const apiUrlCreatorRef = useRef(apiUrlCreator);
	const articlePropsRef = useRef(articleProps);
	const editorUpdateContent = EditorService.createOnUpdateCallback();
	const updateTitle = EditorService.createUpdateTitleFunction();
	const editorHandlePaste = EditorService.createHandlePasteCallback(resourceService);

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

	const { start: debouncedUpdateContent, cancel: cancelDebouncedUpdateContent } = useDebounce(updateContent, 500);

	const { start: debouncedUpdateTitle, cancel: cancelDebouncedUpdateTitle } = useDebounce(
		async (newTitle: string, fileName?: string) => {
			await updateTitle(
				{
					apiUrlCreator: apiUrlCreatorRef.current,
					articleProps: articlePropsRef.current,
				},
				router,
				newTitle,
				fileName,
			);
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

			if (maybeKebabName || newTitle !== articleProps.title)
				updateTitle(
					{
						apiUrlCreator: apiUrlCreatorRef.current,
						articleProps: articlePropsRef.current,
					},
					router,
					newTitle,
					maybeKebabName,
				);
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

	const extensions = useMemo(
		() =>
			getExtensions({
				includeResources: true,
				...(actualData.articleProps.template && { isTemplateInstance: true }),
			}),
		[actualData.articleProps.ref.path, actualData.articleProps.template],
	);

	return (
		<ArticleUpdater data={actualData} onUpdate={onUpdate}>
			<ArticleParent>
				<ContentEditor
					content={actualData.articleContentEdit}
					extensions={extensions}
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
	const { isStaticCli } = usePlatform();
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
				{typeof window == "undefined" && !isStaticCli
					? data.markdown
					: Renderer(JSON.parse(data.articleContentRender), { components: useMemo(getComponents, []) })}
				<ArticleMat />
			</>
		</ArticleParent>
	);
});
