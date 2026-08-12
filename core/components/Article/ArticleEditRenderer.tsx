import { NEW_ARTICLE_REGEX } from "@app/config/const";
import type { ArticleComponentProps } from "@components/Article/Article";
import { ArticleParent } from "@components/Article/ArticleRenderer";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import useWatch from "@core-ui/hooks/useWatch";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import type { BaseEditorContext } from "@core-ui/stores/EditorStore";
import {
	createHandlePasteCallback,
	createOnUpdateCallback,
	createUpdateTitleFunction,
} from "@core-ui/utils/EditorCallbacks";
import { createOpenApiTocItemsResolver } from "@ext/markdown/elements/openApi/edit/logic/OpenApiTocItemsStore";
import {
	OpenApiTocItemsStoreProvider,
	useOpenApiTocItemsStore,
} from "@ext/markdown/elements/openApi/edit/logic/OpenApiTocItemsStore.provider";
import getTocItems, { getLevelTocItemsByJSONContent } from "@ext/navigation/article/logic/createTocItems";
import PropertyService from "@ext/properties/components/PropertyService";
import type { Editor } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef } from "react";
import ContentEditor from "../../extensions/markdown/core/edit/components/ContentEditor";
import getExtensions from "../../extensions/markdown/core/edit/logic/getExtensions";
import ArticleUpdater from "./ArticleUpdater/ArticleUpdater";

export const ArticleEditRenderer = ({ data: { content } }: ArticleComponentProps<"edit">) => {
	const { articleProps, updateArticleProps } = useArticlePropsStore((state) => ({
		articleProps: state.data,
		updateArticleProps: state.update,
	}));

	const resourceService = ResourceService.value;
	const workspace = Workspace.current();
	const isGES = !!workspace?.enterprise?.gesUrl;
	const gesModules = workspace?.enterprise?.modules;

	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { openApiTocItemsData } = useOpenApiTocItemsStore((store) => ({
		openApiTocItemsData: store.data,
	}));

	const propertyService = PropertyService.value;

	const apiUrlCreatorRef = useRef(apiUrlCreator);
	const articlePropsRef = useRef(articleProps);
	const propertyServiceRef = useRef(propertyService);
	const editorUpdateContent = createOnUpdateCallback();
	const updateTitle = createUpdateTitleFunction();
	const editorHandlePaste = createHandlePasteCallback(resourceService);

	const pendingPromise = useRef(Promise.resolve());
	const lastUpdateRef = useRef<{ filename?: string }>({});

	useWatch(() => {
		apiUrlCreatorRef.current = apiUrlCreator;
		articlePropsRef.current = articleProps;
		propertyServiceRef.current = propertyService;
	}, [apiUrlCreator, articleProps, propertyService.articleProperties]);

	// Title the article had when it was opened. A placeholder file (untitled/new_article_*)
	// is renamed to the title slug only after the user actually edits the title — cloned
	// catalogs may legitimately contain such files, and renaming them on mere focus loss
	// leaves the rest of the UI holding a stale article path.
	const loadedTitleRef = useRef(articleProps.title);
	useWatch(() => {
		loadedTitleRef.current = articleProps.title;
	}, [articleProps.ref.path]);

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
	}, [cancelDebouncedUpdateContent, cancelDebouncedUpdateTitle, apiUrlCreator, articleProps.ref.path]);

	const onTitleNeedsUpdate = useCallback(
		({ newTitle, apiUrlCreator }: { newTitle: string } & BaseEditorContext) => {
			const maybeKebabName =
				newTitle &&
				newTitle !== loadedTitleRef.current &&
				NEW_ARTICLE_REGEX.test(articlePropsRef.current?.fileName)
					? transliterate(newTitle, { kebab: true, maxLength: 50 })
					: undefined;

			if (maybeKebabName || newTitle !== articlePropsRef.current?.title)
				pendingPromise.current = pendingPromise.current.finally(async () => {
					if (lastUpdateRef.current.filename === maybeKebabName) return;

					lastUpdateRef.current = { filename: maybeKebabName };
					await updateTitle(
						{
							articleProps: articlePropsRef.current,
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
		const tocItems = getTocItems(
			getLevelTocItemsByJSONContent(editor.state.doc, createOpenApiTocItemsResolver(openApiTocItemsData)),
		);
		if (tocItems) updateArticleProps({ tocItems: [...tocItems] });

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
				...(articleProps.template && { isTemplateInstance: true }),
			}),
		[articleProps.ref.path, articleProps.template, isGES, gesModules?.quiz],
	);

	return (
		<ArticleUpdater>
			<ArticleParent>
				<ContentEditor
					apiUrlCreatorRef={apiUrlCreatorRef}
					articlePropsRef={articlePropsRef}
					content={content}
					extensions={extensions}
					handlePaste={editorHandlePaste}
					onTitleLoseFocus={onTitleNeedsUpdate}
					onUpdate={onContentUpdate}
				/>
			</ArticleParent>
		</ArticleUpdater>
	);
};

export default (props: ArticleComponentProps<"edit">) => (
	<OpenApiTocItemsStoreProvider>
		<ArticleEditRenderer {...props} />
	</OpenApiTocItemsStoreProvider>
);
