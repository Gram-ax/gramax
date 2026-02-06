import { NEW_ARTICLE_REGEX } from "@app/config/const";
import { classNames } from "@components/libs/classNames";
import { useRouter } from "@core/Api/useRouter";
import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import EditorService, { type BaseEditorContext } from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import PropertyService from "@ext/properties/components/PropertyService";
import type { Editor } from "@tiptap/core";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import getComponents from "../../extensions/markdown/core/render/components/getComponents/getComponents";
import Header from "../../extensions/markdown/elements/heading/render/components/Header";
import ArticleUpdater from "./ArticleUpdater/ArticleUpdater";
import { highlightFragmentInDocportalByUrl } from "./SearchHandler/ArticleSearchFragmentHander";

interface ArticleRendererProps {
	data: ArticlePageData;
}

const ArticleParent = ({ children }: { children: React.ReactNode }) => {
	return <div className={classNames("article-body")}>{children}</div>;
};

export const ArticleEditRenderer = (props: ArticleRendererProps) => {
	const { data } = props;

	const resourceService = ResourceService.value;
	const workspace = Workspace.current();
	const isGES = !!workspace?.enterprise?.gesUrl;
	const gesModules = workspace?.enterprise?.modules;
	const [actualData, setActualData] = useState(data);

	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const { value: articleProps, setArticleProps, setTocItems } = ArticlePropsService;
	const propertyService = PropertyService.value;

	const apiUrlCreatorRef = useRef(apiUrlCreator);
	const articlePropsRef = useRef(articleProps);
	const propertyServiceRef = useRef(propertyService);
	const editorUpdateContent = EditorService.createOnUpdateCallback();
	const updateTitle = EditorService.createUpdateTitleFunction();
	const editorHandlePaste = EditorService.createHandlePasteCallback(resourceService);

	const pendingPromise = useRef(Promise.resolve());
	const lastUpdateRef = useRef<{ filename?: string }>({});

	useWatch(() => {
		apiUrlCreatorRef.current = apiUrlCreator;
		articlePropsRef.current = articleProps;
		propertyServiceRef.current = propertyService;
	}, [apiUrlCreator, articleProps, propertyService.articleProperties]);

	useEffect(() => {
		setActualData(data);
	}, [data]);

	const onUpdate = (newData: ArticlePageData) => {
		setActualData(newData);
		setArticleProps(newData.articleProps);

		resourceService.clear();

		const editor = EditorService.getEditor();
		// Clear history to avoid nodes with resources don't be error on undo/redo
		if (editor) editor.chain().clearHistory().setContent(JSON.parse(newData.articleContentEdit)).run();
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
					propertyService: propertyServiceRef.current,
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
		({ newTitle, articleProps, apiUrlCreator }: { newTitle: string } & BaseEditorContext) => {
			const maybeKebabName =
				newTitle && NEW_ARTICLE_REGEX.test(articleProps.fileName)
					? transliterate(newTitle, { kebab: true, maxLength: 50 })
					: undefined;

			if (maybeKebabName || newTitle !== articleProps.title)
				pendingPromise.current = pendingPromise.current.finally(async () => {
					if (lastUpdateRef.current.filename === maybeKebabName) return;

					lastUpdateRef.current = { filename: maybeKebabName };
					await updateTitle(
						{
							articleProps,
							apiUrlCreator,
							propertyService: propertyServiceRef.current,
						},
						router,
						newTitle,
						maybeKebabName,
					);
				});
		},
		[updateTitle, articleProps],
	);

	const onContentUpdate = ({ editor }: { editor: Editor }) => {
		const tocItems = getTocItems(getLevelTocItemsByJSONContent(editor.state.doc));
		if (tocItems) setTocItems([...tocItems]);

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
				includeQuestions: isGES && gesModules?.quiz,
				...(actualData.articleProps.template && { isTemplateInstance: true }),
			}),
		[actualData.articleProps.ref.path, actualData.articleProps.template, isGES],
	);

	return (
		<ArticleUpdater data={actualData} onUpdate={onUpdate}>
			<ArticleParent>
				<ContentEditor
					apiUrlCreatorRef={apiUrlCreatorRef}
					articlePropsRef={articlePropsRef}
					content={actualData.articleContentEdit}
					extensions={extensions}
					handlePaste={editorHandlePaste}
					onTitleLoseFocus={onTitleNeedsUpdate}
					onUpdate={onContentUpdate}
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
				<Header className={"article-title"} dataQa={"article-title"} level={1}>
					{articleProps.title}
				</Header>
				{!articleProps.description ? null : (
					<Header className={"article-description"} dataQa={"article-description"} level={2}>
						{articleProps.description}
					</Header>
				)}
				{Renderer(
					JSON.parse(data.articleContentRender),
					{ components: useMemo(getComponents, []) },
					false,
					() => highlightFragmentInDocportalByUrl(100),
				)}
				<ArticleMat />
			</>
		</ArticleParent>
	);
});
