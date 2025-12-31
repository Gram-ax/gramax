import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import Toolbar from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import useContentEditorHooks from "@ext/markdown/core/edit/components/UseContentEditorHooks";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import ArticleTitleHelpers from "@ext/markdown/elements/article/edit/ArticleTitleHelpers";
import { InlineToolbar } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import CommentEditorProvider from "@ext/markdown/elements/comment/edit/logic/CommentEditorProvider";
import useCommentCallbacks from "@ext/markdown/elements/comment/edit/logic/hooks/useCommentCallbacks";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import Controllers from "@ext/markdown/elements/controllers/controllers";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { updateEditorExtensions } from "@ext/markdown/elements/diff/components/store/EditorExtensionsStore";
import { InlineLinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/InlineLinkMenu";
import Placeholder from "@ext/markdown/elements/placeholder/placeholder";
import EditorService, {
	BaseEditorContext,
	EditorContext as EditorContextType,
	EditorPasteHandler,
} from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import Document from "@tiptap/extension-document";
import { EditorContent, EditorContext, Extensions, JSONContent, useEditor } from "@tiptap/react";
import { RefObject, useEffect, useMemo, useRef } from "react";
import { highlightFragmentInEditorByUrl } from "../../../../../components/Article/SearchHandler/ArticleSearchFragmentHander";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import OnAddMark from "../../../elements/onAdd/OnAddMark";
import OnDeleteMark from "../../../elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "../../../elements/onDocChange/OnDeleteNode";
import ExtensionContextUpdater from "../../../elementsUtils/editExtensionUpdator/ExtensionContextUpdater";
import { useGetEditorProps } from "../logic/useGetEditorProps";
import Menu from "./Menu/Menu";

export const ContentEditorId = "ContentEditorId";

interface ContentEditorProps {
	content: string;
	extensions: Extensions;
	handlePaste: EditorPasteHandler;
	articlePropsRef: RefObject<ClientArticleProps>;
	apiUrlCreatorRef: RefObject<ApiUrlCreator>;
	onTitleLoseFocus: (props: { newTitle: string } & BaseEditorContext) => void;
	onUpdate: (editorContext: EditorContextType) => void;
}

const ContentEditor = (props: ContentEditorProps) => {
	const { content, extensions, onTitleLoseFocus, onUpdate, handlePaste, articlePropsRef, apiUrlCreatorRef } = props;

	const catalogProps = useCatalogPropsStore((state) => state.data);
	const resourceService = ResourceService.value;
	const pageDataContext = PageDataContextService.value;
	const isGramaxAiEnabled = pageDataContext.conf.ai.enabled;
	const isStorageConnected = useIsStorageConnected();

	const catalogPropsRef = useRef(catalogProps);

	const { onDeleteNodes, onDeleteMarks, onAddMarks } = useContentEditorHooks();
	const { onMarkAdded: onMarkAddedComment, onMarkDeleted: onMarkDeletedComment } = useCommentCallbacks(
		articlePropsRef.current.pathname,
	);

	const ext = useMemo(
		() => [
			...extensions,
			Placeholder,
			Document.extend({ content: `paragraph ${ElementGroups.block}+` }),
			Controllers.configure({ editable: articlePropsRef.current?.template?.length > 0 }),
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
					onTitleLoseFocus({ newTitle, apiUrlCreator, articleProps }),
			}),
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
			isStorageConnected,
		],
	);

	const extensionsList = ExtensionContextUpdater.useExtendExtensionsWithContext(ext);

	useEffect(() => {
		updateEditorExtensions(extensionsList);
	}, [extensionsList]);

	useWatch(() => {
		const extension = extensionsList.find((ext) => ext.name === "controllers");
		if (!extension) return;

		if (!articlePropsRef.current?.template?.length) {
			extension.configure({ editable: false });
			return;
		}

		extension.configure({ editable: true });
	}, [articlePropsRef.current?.template]);

	const editorProps = useGetEditorProps();

	const editor = useEditor(
		{
			content: JSON.parse(content) as JSONContent,
			extensions: extensionsList,
			injectCSS: false,
			editorProps: {
				...editorProps,
				handlePaste: (view, event, slice) =>
					handlePaste(
						view,
						event,
						slice,
						apiUrlCreatorRef.current,
						articlePropsRef.current,
						catalogPropsRef.current,
					),
			},
			onUpdate: ({ editor }) =>
				onUpdate({ editor, apiUrlCreator: apiUrlCreatorRef.current, articleProps: articlePropsRef.current }),
			editable: true,
		},
		[content],
	);

	useWatch(() => {
		if (!editor) return;

		const extension = editor.extensionManager.extensions.find((ext) => ext.name === "controllers");
		if (!extension) return;

		const editable = !!articlePropsRef.current?.template?.length;

		if (extension.options.editable !== editable) {
			extension.options.editable = editable;
			editor.view.updateState(editor.state);
		}
	}, [articlePropsRef.current?.template, editor]);

	ExtensionContextUpdater.useUpdateContextInExtensions(editor);

	useEffect(() => {
		if (!editor) return;
		if (editor && !editor.state.doc.textContent) editor.commands.focus();
		if (editor) {
			EditorService.bindEditor(editor);
			editor.on("create", () => highlightFragmentInEditorByUrl());
		}
	}, [editor]);

	useEffect(() => {
		if (!editor) return;
		editor.storage.ai = editor.storage.ai || {};
		editor.storage.ai.enabled = pageDataContext.conf.ai.enabled;
	}, [editor]);

	return (
		<EditorContext.Provider value={{ editor }}>
			<ButtonStateService.Provider editor={editor}>
				<Menu editor={editor} id={ContentEditorId}>
					<Toolbar
						editor={editor}
						isGramaxAiEnabled={isGramaxAiEnabled}
						fileName={articlePropsRef.current?.fileName}
					/>
				</Menu>
				<CommentEditorProvider editor={editor}>
					<div>
						<InlineLinkMenu editor={editor} />
						<InlineToolbar editor={editor} />
						<EditorContent editor={editor} data-qa="article-editor" data-iseditable={true} />
					</div>
				</CommentEditorProvider>
				<ArticleMat editor={editor} />
			</ButtonStateService.Provider>
		</EditorContext.Provider>
	);
};

export default ContentEditor;
