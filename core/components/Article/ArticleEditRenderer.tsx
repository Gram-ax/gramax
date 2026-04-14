import { NEW_ARTICLE_REGEX } from "@app/config/const";
import { ArticleParent } from "@components/Article/ArticleRenderer";
import { useRouter } from "@core/Api/useRouter";
import type { EditArticlePageData } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import EditorService, { type BaseEditorContext } from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import PropertyService from "@ext/properties/components/PropertyService";
import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import ArticleUpdater from "./ArticleUpdater/ArticleUpdater";

interface ArticleRendererProps {
	data: EditArticlePageData;
}

export const ArticleEditRenderer = (props: ArticleRendererProps) => {
	const { data } = props;

	const resourceService = ResourceService.value;
	const workspace = Workspace.current();
	const isGES = !!workspace?.enterprise?.gesUrl;
	const gesModules = workspace?.enterprise?.modules;
	const [actualData, setActualData] = useState<EditArticlePageData>(data);

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

	const onUpdate = useCallback(
		(newData: EditArticlePageData) => {
			setActualData(newData);
			setArticleProps(newData.articleProps);

			resourceService.clear();

			const editor = EditorService.getEditor();
			// Clear history to avoid nodes with resources don't be error on undo/redo
			if (editor) editor.chain().clearHistory().setContent(JSON.parse(newData.content)).run();
		},
		[resourceService?.clear, setArticleProps],
	);

	const updateContent = useCallback(
		async (editor: Editor) => {
			await editorUpdateContent({
				editor,
				apiUrlCreator: apiUrlCreatorRef.current,
				articleProps: articlePropsRef.current,
			});
		},
		[editorUpdateContent],
	);

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		return () => {
			if (window.debug) window.debug.forceSave = null;
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
		[updateTitle, router],
	);

	const onContentUpdate = ({ editor }: { editor: Editor }) => {
		const tocItems = getTocItems(getLevelTocItemsByJSONContent(editor.state.doc));
		if (tocItems) setTocItems([...tocItems]);

		if (typeof window !== "undefined" && window.debug) window.debug.forceSave = () => updateContent(editor);

		debouncedUpdateContent(editor);
		if (articleProps.title !== editor.state.doc.firstChild.textContent) {
			debouncedUpdateTitle(editor.state.doc.firstChild.textContent);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const extensions = useMemo(
		() =>
			getExtensions({
				includeResources: true,
				includeQuestions: isGES && gesModules?.quiz,
				...(actualData.articleProps.template && { isTemplateInstance: true }),
			}),
		[actualData.articleProps.ref.path, actualData.articleProps.template, isGES, gesModules?.quiz],
	);

	return (
		<ArticleUpdater data={actualData} onUpdate={onUpdate}>
			<ArticleParent>
				<ContentEditor
					apiUrlCreatorRef={apiUrlCreatorRef}
					articlePropsRef={articlePropsRef}
					content={actualData.content}
					extensions={extensions}
					handlePaste={editorHandlePaste}
					onTitleLoseFocus={onTitleNeedsUpdate}
					onUpdate={onContentUpdate}
				/>
			</ArticleParent>
		</ArticleUpdater>
	);
};
