import ArticleExtensions from "@components/Article/ArticleExtensions";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import Workspace from "@core-ui/ContextServices/Workspace";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import ArticleContextWrapper from "@core-ui/ScopedContextWrapper/ArticleContextWrapper";
import useGetArticleContextData from "@core-ui/ScopedContextWrapper/useGetArticleContextData";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import Menu from "@ext/markdown/core/edit/components/Menu/Menu";
import Toolbar from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import useContentEditorHooks from "@ext/markdown/core/edit/components/UseContentEditorHooks";
import getExtensions, { getTemplateExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import { InlineToolbar } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import CommentEditorProvider from "@ext/markdown/elements/comment/edit/logic/CommentEditorProvider";
import useCommentCallbacks from "@ext/markdown/elements/comment/edit/logic/hooks/useCommentCallbacks";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import Controllers from "@ext/markdown/elements/controllers/controllers";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import LoadingWithDiffBottomBar from "@ext/markdown/elements/diff/components/LoadingWithDiffBottomBar";
import { useDiffViewMode } from "@ext/markdown/elements/diff/components/store/DiffViewModeStore";
import { useEditorExtensions } from "@ext/markdown/elements/diff/components/store/EditorExtensionsStore";
import DiffExtension from "@ext/markdown/elements/diff/logic/DiffExtension";
import useDiff from "@ext/markdown/elements/diff/logic/hooks/useDiff";
import { InlineLinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/InlineLinkMenu";
import OnAddMark from "@ext/markdown/elements/onAdd/OnAddMark";
import OnDeleteMark from "@ext/markdown/elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "@ext/markdown/elements/onDocChange/OnDeleteNode";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import ExtensionContextUpdater from "@ext/markdown/elementsUtils/editExtensionUpdator/ExtensionContextUpdater";
import PropertyService from "@ext/properties/components/PropertyService";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Editor, Extensions } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import { EditorContent, EditorContext, JSONContent, useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";

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

	const handlePaste = EditorService.createHandlePasteCallback(resourceService);
	const editorOnUpdate = EditorService.createOnUpdateCallback();
	const editorTitleOnUpdate = EditorService.createUpdateTitleFunction();
	const propertyService = PropertyService.value;
	const workspace = Workspace.current();
	const isGES = !!workspace?.enterprise?.gesUrl;

	const articleProps = ArticlePropsService.value;
	const catalogProps = useCatalogPropsStore((state) => state?.data);
	const oldContextArticlePath = Path.join(catalogProps?.name, oldArticlePath ?? articlePath);

	const isDelete = changeType === FileStatus.delete;
	const isAdded = changeType === FileStatus.new;

	const isTemplateInstance = articleProps.template?.length > 0;

	const { start: onUpdateDebounce } = useDebounce((editor: Editor) => {
		editorOnUpdate({ editor, apiUrlCreator, articleProps });
		if (articleProps.title !== editor.state.doc.firstChild.textContent) {
			editorTitleOnUpdate(
				{ apiUrlCreator, articleProps, propertyService },
				router,
				editor.state.doc.firstChild.textContent,
			);
		}
	}, 500);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const { apiUrlCreator: oldDiffArticleApiUrlCreator, isLoading: isOldArticleContextDataLoading } =
		useGetArticleContextData({
			articlePath: isAdded ? null : oldContextArticlePath,
			catalogName: isAdded ? null : catalogProps.name,
			scope: oldScope,
		});

	const isPin = SidebarsIsPinService.value;
	const hasChanges = changeType === FileStatus.modified || changeType === FileStatus.rename;
	const [diffBottomBarHeight, setDiffBottomBarHeight] = useState(0);

	useEffect(() => {
		const bottomBarElement = document.getElementById("diff-bottom-bar");
		if (!bottomBarElement) return;
		const height = bottomBarElement.getBoundingClientRect().height;
		setDiffBottomBarHeight(height);
	}, []);

	const UpdatedDiffExtension = ExtensionContextUpdater.useExtendExtensionsWithContext([
		DiffExtension.configure({ isPin, oldScope, newScope, articlePath: oldContextArticlePath }),
	])[0] as typeof DiffExtension;

	const { onDeleteNodes, onDeleteMarks, onAddMarks } = useContentEditorHooks();
	const isStorageConnected = useIsStorageConnected();

	const { onMarkAdded: onMarkAddedComment, onMarkDeleted: onMarkDeletedComment } = useCommentCallbacks(
		articleProps.pathname,
	);

	const getNewEditorExtensions = () => {
		if (!extensions)
			return [
				...getExtensions({ isTemplateInstance, includeResources: true, includeQuestions: isGES }),
				Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
			];

		const filterMainEditorExtensions = ["onDeleteNode", "OnDeleteMark", "OnAddMark", "comment"];

		const updatedExtensions = [
			...extensions.filter((e) => !filterMainEditorExtensions.includes(e.name)),
			UpdatedDiffExtension,
			OnDeleteNode.configure({ onDeleteNodes }),
			OnAddMark.configure({ onAddMarks }),
			OnDeleteMark.configure({ onDeleteMarks }),
			Controllers.configure({ editable: isTemplateInstance }),
			Comment.configure({
				enabled: isStorageConnected,
				onMarkAdded: onMarkAddedComment,
				onMarkDeleted: onMarkDeletedComment,
			}),
			...(isTemplateInstance ? getTemplateExtensions(readOnly) : []),
		];
		if (readOnly) return getReadOnlyExtensions(updatedExtensions);
		return updatedExtensions;
	};

	const getReadOnlyExtensions = (extensions: Extensions) => {
		const excludeExtensions = ["selectionMenu", "ArticleTitleHelpers"];
		return extensions.filter((e) => !excludeExtensions.includes(e.name));
	};

	const newEditor = useEditor(
		{
			extensions: getNewEditorExtensions(),
			content: extensions ? newContent : undefined,
			editorProps: {
				handlePaste: (view, event, slice) =>
					handlePaste(view, event, slice, apiUrlCreator, articleProps, catalogProps),
			},
			editable: !readOnly,
			onUpdate: ({ editor }) => {
				if (!editor.isEditable) return;
				currentOnUpdate?.({ editor, apiUrlCreator, articleProps });
				onUpdateDebounce(editor);
			},
		},
		[extensions, newContent, articleProps, catalogProps],
	);

	ExtensionContextUpdater.useUpdateContextInExtensions(newEditor);

	const oldContentEditor = useEditor(
		{
			extensions: extensions
				? [
						...getReadOnlyExtensions(extensions).filter((e) => e.name !== "comment"),
						UpdatedDiffExtension.configure({ isOldEditor: true }),
						Comment.configure({ appendCommentToBody: true }),
						...(isTemplateInstance ? getTemplateExtensions(false) : []),
					]
				: [
						...getExtensions({ isTemplateInstance, includeResources: true, includeQuestions: isGES }),
						Comment.configure({ appendCommentToBody: true }),
						Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
					],
			editable: false,
			content: extensions ? oldContent : undefined,
		},
		[extensions, oldContent, isGES],
	);

	useEffect(() => {
		newEditor.commands.updateIsPin(isPin, true);
		oldContentEditor.commands.updateIsPin(isPin, false);
	}, [isPin.left, isPin.right]);

	const diffViewMode = useDiffViewMode();

	useEffect(() => {
		newEditor.commands.updateDiffViewMode(diffViewMode, true);
	}, [diffViewMode]);

	const mainArticleWrapper = isDelete ? (
		<ArticleContextWrapper articlePath={oldContextArticlePath} scope={oldScope}>
			<EditorContext.Provider value={{ editor: oldContentEditor }}>
				<CommentEditorProvider editor={oldContentEditor}>
					<div>
						<InlineToolbar editor={oldContentEditor} />
						<InlineLinkMenu editor={oldContentEditor} />
						<EditorContent data-iseditable={false} data-qa="article-editor" editor={oldContentEditor} />
					</div>
				</CommentEditorProvider>
			</EditorContext.Provider>
		</ArticleContextWrapper>
	) : (
		<CommentEditorProvider editor={newEditor}>
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
					hasChanges &&
					diffViewMode !== "wysiwyg-single" && (
						<ArticleContextWrapper articlePath={oldContextArticlePath} scope={oldScope}>
							<EditorContext.Provider value={{ editor: oldContentEditor }}>
								<CommentEditorProvider editor={oldContentEditor}>
									<div style={{ marginLeft: "0.5rem" }}>
										<InlineToolbar editor={oldContentEditor} />
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
					)
				}
			/>
			{readOnly ? (
				<ArticleMat />
			) : (
				<>
					<ArticleMat editor={newEditor} />
					<Menu editor={newEditor} id={"ContentEditorId"} key={"diff-mode-extensions"}>
						<Toolbar editor={newEditor} />
					</Menu>
					<ArticleExtensions bottom={`${diffBottomBarHeight + 4}px`} id={"ContentEditorId"} />
				</>
			)}
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

	return (
		<div>
			<InlineToolbar editor={newEditor} />
			<InlineLinkMenu editor={newEditor} />
			<EditorContent data-iseditable={!readOnly} data-qa="article-editor" editor={newEditor} />
		</div>
	);
};

export const DiffModeView = (props: DiffModeViewProps & { filePath: DiffFilePaths }) => {
	const { articlePath, newScope, oldScope, changeType, filePath } = props;
	const scope = changeType === FileStatus.delete ? oldScope : newScope;
	const catalogName = useCatalogPropsStore((state) => state.data.name);

	return (
		<ArticleContextWrapper
			articlePath={Path.join(catalogName, articlePath)}
			loader={<LoadingWithDiffBottomBar filePath={filePath} />}
			scope={scope}
		>
			<DiffModeViewInternal {...props} />
		</ArticleContextWrapper>
	);
};

export default DiffModeView;
