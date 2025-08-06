import useWatch from "@core-ui/hooks/useWatch";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import Main from "@ext/markdown/core/edit/components/Menu/Menus/Main";
import useContentEditorHooks from "@ext/markdown/core/edit/components/UseContentEditorHooks";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import ArticleTitleHelpers from "@ext/markdown/elements/article/edit/ArticleTitleHelpers";
import Controllers from "@ext/markdown/elements/controllers/controllers";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import Placeholder from "@ext/markdown/elements/placeholder/placeholder";
import EditorService, {
	BaseEditorContext,
	EditorContext as EditorContextType,
	EditorPasteHandler,
} from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import Document from "@tiptap/extension-document";
import { EditorContent, EditorContext, Extensions, JSONContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ArticlePropsService from "../../../../../ui-logic/ContextServices/ArticleProps";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import SelectionMenu from "../../../elements/article/edit/helpers/SelectionMenu";
import OnAddMark from "../../../elements/onAdd/OnAddMark";
import OnDeleteMark from "../../../elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "../../../elements/onDocChange/OnDeleteNode";
import ExtensionContextUpdater from "../../../elementsUtils/editExtensionUpdator/ExtensionContextUpdater";
import Menu from "./Menu/Menu";
import CommentEditorProvider from "@ext/markdown/elements/comment/edit/logic/CommentEditorProvider";
import useCommentCallbacks from "@ext/markdown/elements/comment/edit/logic/hooks/useCommentCallbacks";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";

export const ContentEditorId = "ContentEditorId";

interface ContentEditorProps {
	content: string;
	extensions: Extensions;
	onTitleLoseFocus: (props: { newTitle: string } & BaseEditorContext) => void;
	onUpdate: (editorContext: EditorContextType) => void;
	handlePaste: EditorPasteHandler;
}

const ContentEditor = (props: ContentEditorProps) => {
	const { content, extensions, onTitleLoseFocus, onUpdate, handlePaste } = props;

	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const resourceService = ResourceService.value;
	const pageDataContext = PageDataContextService.value;
	const isGramaxAiEnabled = pageDataContext.conf.ai.enabled;

	const { onDeleteNodes, onDeleteMarks, onAddMarks } = useContentEditorHooks();
	const { onMarkAdded: onMarkAddedComment, onMarkDeleted: onMarkDeletedComment } = useCommentCallbacks(
		articleProps.pathname,
	);

	const ext = useMemo(
		() => [
			...extensions,
			Placeholder,
			Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
			Controllers.configure({ editable: articleProps?.template?.length > 0 }),
			OnDeleteNode.configure({ onDeleteNodes }),
			OnAddMark.configure({ onAddMarks }),
			Comment.configure({ onMarkAdded: onMarkAddedComment, onMarkDeleted: onMarkDeletedComment }),
			CopyArticles.configure({ resourceService }),
			OnDeleteMark.configure({ onDeleteMarks }),
			ArticleTitleHelpers.configure({
				onTitleLoseFocus: ({ newTitle, articleProps, apiUrlCreator }) =>
					onTitleLoseFocus({ newTitle, apiUrlCreator, articleProps }),
			}),
			SelectionMenu,
		],
		[
			extensions,
			onTitleLoseFocus,
			onDeleteNodes,
			onAddMarks,
			onDeleteMarks,
			resourceService,
			onMarkAddedComment,
			onMarkDeletedComment,
		],
	);

	const extensionsList = ExtensionContextUpdater.useExtendExtensionsWithContext(ext);

	useEffect(() => {
		EditorExtensionsService.value = extensionsList;
	}, [extensionsList]);

	useWatch(() => {
		const extension = extensionsList.find((ext) => ext.name === "controllers");
		if (!extension) return;

		if (!articleProps?.template?.length) {
			extension.configure({ editable: false });
			return;
		}

		extension.configure({ editable: true });
	}, [articleProps?.template]);

	const editor = useEditor(
		{
			content: JSON.parse(content) as JSONContent,
			extensions: extensionsList,
			injectCSS: false,
			editorProps: {
				handlePaste: (view, event, slice) => handlePaste(view, event, slice, apiUrlCreator, articleProps),
			},
			onUpdate: ({ editor }) => onUpdate({ editor, apiUrlCreator, articleProps }),
			editable: true,
		},
		[content, apiUrlCreator, pageDataContext, articleProps.ref.path],
	);

	ExtensionContextUpdater.useUpdateContextInExtensions(editor);

	useEffect(() => {
		if (!editor) return;
		if (editor && !editor.state.doc.textContent) editor.commands.focus();
		if (editor) EditorService.bindEditor(editor);
	}, [editor]);

	useEffect(() => {
		if (!editor) return;
		editor.storage.ai = editor.storage.ai || {};
		editor.storage.ai.enabled = pageDataContext.conf.ai.enabled;
	}, [editor]);

	return (
		<EditorContext.Provider value={{ editor }}>
			<Menu editor={editor} id={ContentEditorId}>
				<Main editor={editor} isGramaxAiEnabled={isGramaxAiEnabled} fileName={articleProps.fileName} />
			</Menu>
			<CommentEditorProvider editor={editor}>
				<EditorContent editor={editor} data-qa="article-editor" data-iseditable={true} />
			</CommentEditorProvider>
			<ArticleMat editor={editor} />
		</EditorContext.Provider>
	);
};

export default ContentEditor;
