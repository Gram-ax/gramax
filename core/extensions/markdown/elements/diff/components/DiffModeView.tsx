import ArticleExtensions from "@components/Article/ArticleExtensions";
import ArticleWithPreviewArticle from "@components/ArticlePage/ArticleWithPreviewArticle";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ArticleContextWrapper from "@core-ui/ArticleContextWrapper/ArticleContextWrapper";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import Menu from "@ext/markdown/core/edit/components/Menu/Menu";
import Main from "@ext/markdown/core/edit/components/Menu/Menus/Main";
import useContentEditorHooks from "@ext/markdown/core/edit/components/UseContentEditorHooks";
import getExtensions, { getTemplateExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import Controllers from "@ext/markdown/elements/controllers/controllers";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import LoadingWithDiffBottomBar from "@ext/markdown/elements/diff/components/LoadingWithDiffBottomBar";
import DiffExtension from "@ext/markdown/elements/diff/logic/DiffExtension";
import useDiff from "@ext/markdown/elements/diff/logic/hooks/useDiff";
import OnAddMark from "@ext/markdown/elements/onAdd/OnAddMark";
import OnDeleteMark from "@ext/markdown/elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "@ext/markdown/elements/onDocChange/OnDeleteNode";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import ExtensionContextUpdater from "@ext/markdown/elementsUtils/editExtensionUpdator/ExtensionContextUpdater";
import PropertyService from "@ext/properties/components/PropertyService";
import { DiffFilePaths } from "@ext/VersionControl/model/Diff";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Editor, Extensions } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
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

	const extensions = EditorExtensionsService.value;
	const resourceService = ResourceService.value;
	const router = useRouter();

	const handlePaste = EditorService.createHandlePasteCallback(resourceService);
	const editorOnUpdate = EditorService.createOnUpdateCallback();
	const editorTitleOnUpdate = EditorService.createUpdateTitleFunction();
	const propertyService = PropertyService.value;

	const articleProps = ArticlePropsService.value;
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
	const oldDiffArticleApiUrlCreator = oldArticlePath ? apiUrlCreator.fromArticle(oldArticlePath) : apiUrlCreator;

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
		DiffExtension.configure({ isPin, oldScope, newScope }),
	])[0] as typeof DiffExtension;

	const { onDeleteNodes, onDeleteMarks, onAddMarks } = useContentEditorHooks();

	const getNewEditorExtensions = () => {
		if (!extensions)
			return [
				...getExtensions({ isTemplateInstance, includeResources: true }),
				Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
			];

		const filterMainEditorExtensions = ["OnDeleteNode", "OnDeleteMark", "OnAddMark"];

		const updatedExtensions = [
			...extensions.filter((e) => !filterMainEditorExtensions.includes(e.name)),
			UpdatedDiffExtension,
			OnDeleteNode.configure({ onDeleteNodes }),
			OnAddMark.configure({ onAddMarks }),
			OnDeleteMark.configure({ onDeleteMarks }),
			Controllers.configure({ editable: isTemplateInstance }),
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
				handlePaste: (view, event, slice) => handlePaste(view, event, slice, apiUrlCreator, articleProps),
			},
			editable: !readOnly,
			onUpdate: ({ editor }) => {
				if (!editor.isEditable) return;
				currentOnUpdate?.({ editor, apiUrlCreator, articleProps });
				onUpdateDebounce(editor);
			},
		},
		[extensions, newContent, articleProps],
	);

	ExtensionContextUpdater.useUpdateContextInExtensions(newEditor);

	const oldContentEditor = useEditor(
		{
			extensions: extensions
				? [
						...getReadOnlyExtensions(extensions),
						UpdatedDiffExtension.configure({ isOldEditor: true }),
						...(isTemplateInstance ? getTemplateExtensions(false) : []),
				  ]
				: [
						...getExtensions({ isTemplateInstance, includeResources: true }),
						Comment,
						Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
				  ],
			editable: false,
			content: extensions ? oldContent : undefined,
		},
		[extensions, oldContent],
	);

	useEffect(() => {
		newEditor.commands.updateIsPin(isPin, true);
		oldContentEditor.commands.updateIsPin(isPin, false);
	}, [isPin.left, isPin.right]);

	const diffViewMode = DiffViewModeService.value;

	useEffect(() => {
		newEditor.commands.updateDiffViewMode(diffViewMode, true);
	}, [diffViewMode]);

	useDiff(hasChanges ? { editor: newEditor, oldContentEditor } : { editor: null, oldContentEditor: null });

	const mainArticle =
		changeType === FileStatus.delete ? (
			<ApiUrlCreatorService.Provider value={oldDiffArticleApiUrlCreator}>
				<EditorContent editor={oldContentEditor} data-qa="article-editor" data-iseditable={false} />
			</ApiUrlCreatorService.Provider>
		) : (
			<EditorContent editor={newEditor} data-qa="article-editor" data-iseditable={!readOnly} />
		);

	const catalogName = CatalogPropsService.value?.name;
	const oldContextArticlePath = Path.join(catalogName, oldArticlePath ?? articlePath);

	const isDelete = changeType === FileStatus.delete;

	const mainArticleWrapper = isDelete ? (
		<ArticleContextWrapper scope={oldScope} articlePath={oldContextArticlePath}>
			{mainArticle}
		</ArticleContextWrapper>
	) : (
		mainArticle
	);

	return (
		<>
			<ArticleWithPreviewArticle
				mainArticle={mainArticleWrapper}
				previewArticle={
					hasChanges &&
					diffViewMode !== "wysiwyg-single" && (
						<ArticleContextWrapper scope={oldScope} articlePath={oldContextArticlePath}>
							<div style={{ marginLeft: "0.5rem" }}>
								<EditorContent
									editor={oldContentEditor}
									data-qa="article-editor"
									data-iseditable={false}
								/>
							</div>
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
						<Main editor={newEditor} />
					</Menu>
					<ArticleExtensions id={"ContentEditorId"} bottom={`${diffBottomBarHeight + 4}px`} />
				</>
			)}
		</>
	);
};

export const DiffModeView = (props: DiffModeViewProps & { filePath: DiffFilePaths }) => {
	const { articlePath, newScope, oldScope, changeType, filePath } = props;
	const scope = changeType === FileStatus.delete ? oldScope : newScope;
	const catalogName = CatalogPropsService.value.name;

	return (
		<ArticleContextWrapper
			scope={scope}
			articlePath={Path.join(catalogName, articlePath)}
			loader={<LoadingWithDiffBottomBar filePath={filePath} />}
		>
			<DiffModeViewInternal {...props} />
		</ArticleContextWrapper>
	);
};

export default DiffModeView;
