import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import ArticleContextWrapper from "@core-ui/ScopedContextWrapper/ArticleContextWrapper";
import useGetArticleContextData from "@core-ui/ScopedContextWrapper/useGetArticleContextData";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { bindEditor } from "@core-ui/stores/EditorStore";
import {
	createHandlePasteCallback,
	createOnUpdateCallback,
	createUpdateTitleFunction,
} from "@core-ui/utils/EditorCallbacks";
import BranchUpdaterService, {
	type OnBranchUpdateListener,
} from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import { PublishEmitter } from "@ext/git/actions/Publish/logic/PublishEmitter";
import LoadingWithDiffBottomBar from "@ext/git/core/Diff/components/LoadingWithDiffBottomBar";
import { useIsDoublePanel } from "@ext/git/core/Diff/components/store/DiffViewModeStore";
import { useEditorExtensions } from "@ext/git/core/Diff/components/store/EditorExtensionsStore";
import useDiff from "@ext/git/core/Diff/logic/hooks/useDiff";
import { useDiffExtensions } from "@ext/git/core/Diff/logic/hooks/useDiffExtensions";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import useContentEditorHooks from "@ext/markdown/core/edit/components/UseContentEditorHooks";
import getExtensions, { getTemplateExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import { useShouldShowInlineToolbar } from "@ext/markdown/core/edit/logic/hooks/useShouldShowInlineToolbar";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import ArticleTitleHelpers from "@ext/markdown/elements/article/edit/ArticleTitleHelpers";
import { InlineToolbar } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import { editName as BLOCK_FIELD } from "@ext/markdown/elements/blockContentField/consts";
import { editName as BLOCK_PROPERTY } from "@ext/markdown/elements/blockProperty/consts";
import CommentEditorProvider from "@ext/markdown/elements/comment/edit/logic/CommentEditorProvider";
import useCommentCallbacks from "@ext/markdown/elements/comment/edit/logic/hooks/useCommentCallbacks";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import Controllers from "@ext/markdown/elements/controllers/controllers";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import { InlineLinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/InlineLinkMenu";
import OnAddMark from "@ext/markdown/elements/onAdd/OnAddMark";
import OnDeleteMark from "@ext/markdown/elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "@ext/markdown/elements/onDocChange/OnDeleteNode";
import Placeholder from "@ext/markdown/elements/placeholder/placeholder";
import useEditorContext from "@ext/markdown/elementsUtils/editorContext/useEditorContext";
import PropertyService from "@ext/properties/components/PropertyService";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import { feature } from "@ext/toggleFeatures/features";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { Editor, Extensions } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import { DecorationSet } from "@tiptap/pm/view";
import { EditorContent, EditorContext, type JSONContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";

const getReadOnlyExtensions = (exts: Extensions) => {
	const excludeExtensions = ["selectionMenu", "ArticleTitleHelpers"];
	return exts.filter((e) => !excludeExtensions.includes(e.name));
};

// block-field/block-property keep their content in the schema only when editable, and the diff
// has to render it — so they are dropped here and re-added by getTemplateExtensions(false)
const FILTER_MAIN_EXTENSIONS = [
	"onDeleteNode",
	"OnDeleteMark",
	"OnAddMark",
	"comment",
	"diff",
	"diffLines",
	BLOCK_FIELD,
	BLOCK_PROPERTY,
];

interface DiffModeViewProps {
	oldContent: JSONContent;
	newContent: JSONContent;
	changeType: FileStatus;
	articlePath: string;
	oldArticlePath?: string;
	oldScope?: TreeReadScope;
	newScope?: TreeReadScope;
	readOnly?: boolean;
	onUpdate?: (props: { editor: Editor; apiUrlCreator: ApiUrlCreator; articleProps: ClientArticleProps }) => void;
}

const DiffModeViewInternal = (props: DiffModeViewProps) => {
	const {
		oldContent,
		newContent,
		changeType,
		articlePath,
		oldArticlePath,
		oldScope,
		newScope,
		readOnly = false,
		onUpdate: currentOnUpdate,
	} = props;

	const extensions = useEditorExtensions();
	const resourceService = ResourceService.value;
	const router = useRouter();

	const handlePaste = createHandlePasteCallback(resourceService);
	const editorOnUpdate = createOnUpdateCallback();
	const editorTitleOnUpdate = createUpdateTitleFunction();
	const editorTitleOnUpdateRef = useRef(editorTitleOnUpdate);
	editorTitleOnUpdateRef.current = editorTitleOnUpdate;

	const propertyService = PropertyService.value;
	const workspace = Workspace.current();
	const isGES = !!workspace?.enterprise?.gesUrl;

	const articleProps = ArticlePropsService.value;
	const articlePropsRef = useRef(articleProps);
	articlePropsRef.current = articleProps;

	const catalogProps = useCatalogPropsStore((state) => state?.data);
	const oldContextArticlePath = Path.join(catalogProps?.name, oldArticlePath ?? articlePath);

	const isDelete = changeType === FileStatus.delete;
	const isAdded = changeType === FileStatus.new;

	const isTemplateInstance = articleProps.template?.length > 0;

	const { start: onUpdateDebounce } = useDebounce((editor: Editor) => {
		void editorOnUpdate({ editor, apiUrlCreator, articleProps });
		if (articleProps.title !== editor.state.doc.firstChild.textContent) {
			void editorTitleOnUpdate(
				{ apiUrlCreator, articleProps, propertyService },
				router,
				editor.state.doc.firstChild.textContent,
			);
		}
	}, 500);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	apiUrlCreatorRef.current = apiUrlCreator;

	const {
		apiUrlCreator: oldDiffArticleApiUrlCreator,
		catalogProps: oldDiffArticleCatalogProps,
		isLoading: isOldArticleContextDataLoading,
	} = useGetArticleContextData({
		articlePath: isAdded || isDelete ? null : oldContextArticlePath,
		catalogName: isAdded || isDelete ? null : catalogProps.name,
		scope: oldScope,
	});

	const hasChanges =
		changeType !== FileStatus.new && changeType !== FileStatus.delete && changeType !== FileStatus.current;

	const { extensions: newDiffExtensions, onEditorCreate: onNewEditorCreate } = useDiffExtensions({
		type: "new",
		oldContent,
		newContent,
		isPin: { left: true, right: true },
		oldScope,
		newScope,
		articlePath: oldContextArticlePath,
		oldApiUrlCreator: oldDiffArticleApiUrlCreator,
		oldCatalogProps: oldDiffArticleCatalogProps,
		isOldContextLoading: isOldArticleContextDataLoading,
	});

	const { onDeleteNodes, onDeleteMarks, onAddMarks } = useContentEditorHooks();
	const isStorageConnected = useIsStorageConnected();

	const {
		onMarkAdded: onMarkAddedComment,
		onMarkDeleted: onMarkDeletedComment,
		onCommentSaved,
	} = useCommentCallbacks(articlePropsRef);

	const newEditorExtensionsBase = useMemo(
		() =>
			extensions
				? [
						...extensions.filter((e) => !FILTER_MAIN_EXTENSIONS.includes(e.name)),
						...newDiffExtensions,
						OnDeleteNode.configure({ onDeleteNodes }),
						OnAddMark.configure({ onAddMarks }),
						OnDeleteMark.configure({ onDeleteMarks }),
						Controllers.configure({ editable: isTemplateInstance }),
						Comment.configure({
							enabled: isStorageConnected,
							onMarkAdded: onMarkAddedComment,
							onMarkDeleted: onMarkDeletedComment,
						}),
						...getTemplateExtensions(false),
					]
				: [
						...getExtensions({ isTemplateInstance, includeResources: true, includeQuestions: isGES }),
						Placeholder,
						Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
						...newDiffExtensions,
						Controllers.configure({ editable: isTemplateInstance }),
						OnDeleteNode.configure({ onDeleteNodes }),
						OnAddMark.configure({ onAddMarks }),
						Comment.configure({
							enabled: isStorageConnected,
							onMarkAdded: onMarkAddedComment,
							onMarkDeleted: onMarkDeletedComment,
						}),
						CopyArticles.configure({ resourceService }),
						OnDeleteMark.configure({ onDeleteMarks }),
						ArticleTitleHelpers.configure({
							onTitleLoseFocus: ({ newTitle, articleProps, apiUrlCreator }) =>
								editorTitleOnUpdateRef.current(
									{ apiUrlCreator, articleProps, propertyService },
									router,
									newTitle,
								),
						}),
						...getTemplateExtensions(false),
					],
		[
			extensions,
			newDiffExtensions,
			onDeleteNodes,
			onAddMarks,
			onDeleteMarks,
			isTemplateInstance,
			isStorageConnected,
			onMarkAddedComment,
			onMarkDeletedComment,
			isGES,
			router,
		],
	);

	const newEditorExtensions = useMemo(
		() => (readOnly ? getReadOnlyExtensions(newEditorExtensionsBase) : newEditorExtensionsBase),
		[readOnly, newEditorExtensionsBase],
	);

	const newEditorExtensionsWithContext = newEditorExtensions;

	const { extensions: oldDiffExtensions, onEditorCreate: onOldEditorCreate } = useDiffExtensions({
		type: "old",
		oldContent,
		newContent,
		isPin: { left: true, right: true },
		oldScope,
		newScope,
		articlePath: oldContextArticlePath,
		oldApiUrlCreator: oldDiffArticleApiUrlCreator,
		oldCatalogProps: oldDiffArticleCatalogProps,
		isOldContextLoading: isOldArticleContextDataLoading,
	});

	const oldEditorExtensionsBase = useMemo(
		() =>
			extensions
				? [
						...getReadOnlyExtensions(extensions).filter((e) => e.name !== "comment"),
						...oldDiffExtensions,
						Comment.configure({ appendCommentToBody: true }),
						...getTemplateExtensions(false),
					]
				: [
						...getExtensions({ isTemplateInstance, includeResources: true, includeQuestions: isGES }),
						Placeholder,
						Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
						...oldDiffExtensions,
						Comment.configure({ appendCommentToBody: true }),
						...getTemplateExtensions(false),
					],
		[extensions, isTemplateInstance, isGES, oldDiffExtensions],
	);

	const oldEditorExtensionsWithContext = oldEditorExtensionsBase;

	const newEditor = useEditor(
		{
			extensions: newEditorExtensionsWithContext,
			content: newContent,
			editorProps: {
				handlePaste: (view, event, slice) =>
					handlePaste(view, event, slice, apiUrlCreatorRef.current, articlePropsRef.current, catalogProps),
			},
			editable: !readOnly,
			onCreate(props) {
				onNewEditorCreate(props.editor);
			},
			onUpdate: ({ editor }) => {
				if (!editor.isEditable) return;
				currentOnUpdate?.({
					editor,
					apiUrlCreator: apiUrlCreatorRef.current,
					articleProps: articlePropsRef.current,
				});
				onUpdateDebounce(editor);
			},
		},
		[newContent],
	);

	useEditorContext(newEditor);

	const oldContentEditor = useEditor(
		{
			extensions: oldEditorExtensionsWithContext,
			editable: false,
			content: oldContent,
			onCreate(props) {
				onOldEditorCreate(props.editor);
			},
		},
		[oldContent],
	);

	useEditorContext(oldContentEditor);

	const isDoublePanel = useIsDoublePanel();

	useEffect(() => {
		if (!newEditor?.commands?.updateIsDoublePanel) return;
		newEditor.commands.updateIsDoublePanel(isDoublePanel, true);
		bindEditor(newEditor);
	}, [isDoublePanel, newEditor]);

	useEffect(() => {
		if (!newEditor || typeof window === "undefined" || !window.debug) return;
		window.debug.forceSave = () =>
			editorOnUpdate({
				editor: newEditor,
				apiUrlCreator: apiUrlCreatorRef.current,
				articleProps: articlePropsRef.current,
			});
		return () => {
			if (window.debug) window.debug.forceSave = null;
		};
	}, [newEditor, editorOnUpdate]);

	const shouldShow = useShouldShowInlineToolbar();

	if (!newEditor || !oldContentEditor) return null;

	const mainArticleWrapper = isDelete ? (
		<ArticleContextWrapper articlePath={oldContextArticlePath} scope={oldScope}>
			<ButtonStateService.Provider editor={oldContentEditor}>
				<EditorContext.Provider value={{ editor: oldContentEditor }}>
					<CommentEditorProvider editor={oldContentEditor} onCommentSaved={onCommentSaved}>
						<div>
							<InlineToolbar editor={oldContentEditor} shouldShow={shouldShow} />
							<InlineLinkMenu editor={oldContentEditor} />
							<EditorContent data-iseditable={false} data-qa="article-editor" editor={oldContentEditor} />
						</div>
					</CommentEditorProvider>
				</EditorContext.Provider>
			</ButtonStateService.Provider>
		</ArticleContextWrapper>
	) : (
		<CommentEditorProvider editor={newEditor} onCommentSaved={onCommentSaved}>
			<EditorContext.Provider value={{ editor: newEditor }}>
				<NewEditorWithDiff
					isUseDiff={hasChanges && !isOldArticleContextDataLoading}
					newApiUrlCreator={apiUrlCreator}
					newEditor={newEditor}
					oldApiUrlCreator={oldDiffArticleApiUrlCreator}
					oldEditor={oldContentEditor}
					readOnly={readOnly}
				/>
			</EditorContext.Provider>
		</CommentEditorProvider>
	);

	return (
		<>
			<ArticleWithPreviewArticle
				mainArticle={mainArticleWrapper}
				previewArticle={
					isDoublePanel && (
						<MinimizedArticleStyled>
							<ArticleContextWrapper articlePath={oldContextArticlePath} scope={oldScope}>
								<EditorContext.Provider value={{ editor: oldContentEditor }}>
									<CommentEditorProvider editor={oldContentEditor}>
										<div style={{ marginLeft: "0.5rem" }}>
											<InlineToolbar editor={oldContentEditor} shouldShow={shouldShow} />
											<InlineLinkMenu editor={oldContentEditor} />
											<EditorContent
												data-iseditable={false}
												data-qa="article-editor"
												editor={oldContentEditor}
											/>
										</div>
									</CommentEditorProvider>
								</EditorContext.Provider>
							</ArticleContextWrapper>
						</MinimizedArticleStyled>
					)
				}
			/>
			<ArticleMat editor={newEditor} />
		</>
	);
};

interface NewEditorWithDiffProps {
	newEditor: Editor;
	oldEditor: Editor;
	readOnly: boolean;
	isUseDiff: boolean;
	newApiUrlCreator: ApiUrlCreator;
	oldApiUrlCreator: ApiUrlCreator;
}

const NewEditorWithDiff = (props: NewEditorWithDiffProps) => {
	const { newEditor, oldEditor, readOnly, isUseDiff, newApiUrlCreator, oldApiUrlCreator } = props;

	useDiff(
		isUseDiff
			? { newEditor, oldEditor, newApiUrlCreator, oldApiUrlCreator }
			: { newEditor: null, oldEditor: null, newApiUrlCreator: null, oldApiUrlCreator: null },
	);

	useEffect(() => {
		if (isUseDiff) return;
		[newEditor, oldEditor].forEach((editor) => {
			if (!editor || editor.isDestroyed) return;
			editor.chain().updateDiffLinesModel([]).setMeta("updateDiffDecorators", DecorationSet.empty).run();
		});
	}, [isUseDiff, newEditor, oldEditor]);

	useEffect(() => {
		if (!feature("new-diffs")) return;

		const resetBaseline = () => {
			[newEditor, oldEditor].forEach((editor) => {
				if (!editor || editor.isDestroyed) return;
				editor.commands.setDiffBaseline(editor.state.doc.content.toJSON());
			});
		};

		const onBranchUpdate: OnBranchUpdateListener = (_, caller) => {
			if (caller !== OnBranchUpdateCaller.DiscardNoReset) return;
			resetBaseline();
		};

		const publishToken = PublishEmitter.events.on("finish", resetBaseline);
		BranchUpdaterService.addListener(onBranchUpdate);
		return () => {
			PublishEmitter.events.off(publishToken);
			BranchUpdaterService.removeListener(onBranchUpdate);
		};
	}, [newEditor, oldEditor]);

	const shouldShow = useShouldShowInlineToolbar();

	return (
		<ButtonStateService.Provider editor={newEditor}>
			<div>
				<InlineToolbar editor={newEditor} shouldShow={shouldShow} />
				<InlineLinkMenu editor={newEditor} />
				<EditorContent data-iseditable={!readOnly} data-qa="article-editor" editor={newEditor} />
			</div>
		</ButtonStateService.Provider>
	);
};

export const DiffModeView = (props: DiffModeViewProps) => {
	const { articlePath, newScope, oldScope, changeType } = props;
	const scope = changeType === FileStatus.delete ? oldScope : newScope;
	const catalogName = useCatalogPropsStore((state) => state.data.name);

	return (
		<ArticleContextWrapper
			articlePath={Path.join(catalogName, articlePath)}
			loader={<LoadingWithDiffBottomBar />}
			scope={scope}
		>
			<DiffModeViewInternal {...props} />
		</ArticleContextWrapper>
	);
};

export default DiffModeView;
