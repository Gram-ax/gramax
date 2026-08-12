import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import {
	type BaseEditorContext,
	bindEditor,
	type EditorContext as EditorContextType,
	type EditorPasteHandler,
	setEditorStore,
} from "@core-ui/stores/EditorStore";
import { updateEditorExtensions } from "@ext/git/core/Diff/components/store/EditorExtensionsStore";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import useContentEditorHooks from "@ext/markdown/core/edit/components/UseContentEditorHooks";
import { useShouldShowInlineToolbar } from "@ext/markdown/core/edit/logic/hooks/useShouldShowInlineToolbar";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import ArticleTitleHelpers from "@ext/markdown/elements/article/edit/ArticleTitleHelpers";
import { InlineToolbar } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import CommentEditorProvider from "@ext/markdown/elements/comment/edit/logic/CommentEditorProvider";
import useCommentCallbacks from "@ext/markdown/elements/comment/edit/logic/hooks/useCommentCallbacks";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import Controllers from "@ext/markdown/elements/controllers/controllers";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import { InlineLinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/InlineLinkMenu";
import Placeholder from "@ext/markdown/elements/placeholder/placeholder";
import { useIsStorageConnected } from "@ext/storage/logic/utils/useStorage";
import Document from "@tiptap/extension-document";
import { EditorContent, EditorContext, type Extensions, type JSONContent, useEditor } from "@tiptap/react";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import { highlightFragmentInEditorByUrl } from "../../../../../components/Article/SearchHandler/ArticleSearchFragmentHander";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import OnAddMark from "../../../elements/onAdd/OnAddMark";
import OnDeleteMark from "../../../elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "../../../elements/onDocChange/OnDeleteNode";
import useEditorContext from "../../../elementsUtils/editorContext/useEditorContext";
import { useGetEditorProps } from "../logic/useGetEditorProps";
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
	const isStorageConnected = useIsStorageConnected();

	const catalogPropsRef = useRef(catalogProps);

	const { onDeleteNodes, onDeleteMarks, onAddMarks } = useContentEditorHooks();
	const {
		onMarkAdded: onMarkAddedComment,
		onMarkDeleted: onMarkDeletedComment,
		onCommentSaved,
	} = useCommentCallbacks(articlePropsRef);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
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

	const extensionsList = ext;

	useEffect(() => {
		updateEditorExtensions(extensionsList);
	}, [extensionsList]);

	const editorProps = useGetEditorProps();

	const editor = useEditor(
		{
			content: JSON.parse(content) as JSONContent,
			extensions: extensionsList,
			enableContentCheck: true,
			onContentError: (props) => console.error(props.error),
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
		[content, extensions],
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

	useEditorContext(editor);

	useEffect(() => {
		if (!editor || editor.isDestroyed || !editor.isEditable) return;
		if (editor && !editor.state.doc.textContent) editor.commands.focus();
		if (editor) {
			bindEditor(editor);
			setEditorStore({ isSmallEditor: false });
			if (typeof window !== "undefined" && window.debug) window.debug.editor = editor;
			editor.on("create", () => highlightFragmentInEditorByUrl());
		}
	}, [editor]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!editor) return;
		editor.storage.ai = editor.storage.ai || {};
		editor.storage.ai.enabled = pageDataContext.conf.ai.enabled;
	}, [editor, pageDataContext?.conf?.ai?.enabled]);

	const shouldShow = useShouldShowInlineToolbar();

	return (
		<EditorContext.Provider value={{ editor }}>
			<ButtonStateService.Provider editor={editor}>
				<CommentEditorProvider editor={editor} onCommentSaved={onCommentSaved}>
					<div>
						<InlineLinkMenu editor={editor} />
						<InlineToolbar editor={editor} shouldShow={shouldShow} />
						<EditorContent
							data-iseditable={true}
							data-qa="article-editor"
							data-testid="article-editor"
							editor={editor}
						/>
					</div>
				</CommentEditorProvider>
				<ArticleMat editor={editor} />
			</ButtonStateService.Provider>
		</EditorContext.Provider>
	);
};

export default ContentEditor;
