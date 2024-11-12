import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import useWatch from "@core-ui/hooks/useWatch";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import OnTitleLoseFocus from "@ext/markdown/elements/article/edit/OnTitleLoseFocus";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorContent, Extensions, JSONContent, useEditor } from "@tiptap/react";
import { Node, Slice } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { useEffect } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ArticlePropsService from "../../../../../ui-logic/ContextServices/ArticleProps";
import PageDataContextService from "../../../../../ui-logic/ContextServices/PageDataContext";
import SelectionMenu from "../../../elements/article/edit/helpers/SelectionMenu";
import addComments from "../../../elements/comment/edit/logic/addCommet";
import deleteComments from "../../../elements/comment/edit/logic/deleteComments";
import deleteDiagrams from "../../../elements/diagrams/logic/deleteDiagrams";
import deleteDrawio from "../../../elements/drawio/edit/logic/deleteDrawio";
import deleteFiles from "../../../elements/file/edit/logic/deleteFiles";
import deleteImages from "../../../elements/image/edit/logic/deleteImages";
import OnAddMark from "../../../elements/onAdd/OnAddMark";
import OnDeleteMark from "../../../elements/onDocChange/OnDeleteMark";
import OnDeleteNode from "../../../elements/onDocChange/OnDeleteNode";
import deleteOpenApi from "../../../elements/openApi/edit/logic/deleteOpenApi";
import ExtensionUpdater from "../../../elementsUtils/editExtensionUpdator/ExtensionUpdater";
import Menu from "./Menu/Menu";

export const ContentEditorId = "ContentEditorId";

interface ContentEditorProps {
	content: string;
	extensions: Extensions;
	onBlur: ({ editor }: { editor: Editor }) => void;
	onTitleLoseFocus: ({ newTitle }: { newTitle: string }) => void;
	onUpdate: ({ editor }: { editor: Editor }) => void;
	handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => boolean | void;
}

const ContentEditor = (props: ContentEditorProps) => {
	const { content, extensions, onBlur, onTitleLoseFocus, onUpdate, handlePaste } = props;

	const comments = CommentCounterService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageDataContext = PageDataContextService.value;
	const articleIsEdit = !articleProps.errorCode;

	const onDeleteNodes = (nodes: Node[]): void => {
		deleteImages(nodes, apiUrlCreator);
		deleteDrawio(nodes, apiUrlCreator);
		deleteOpenApi(nodes, apiUrlCreator);
		deleteDiagrams(nodes, apiUrlCreator);
	};

	const onDeleteMarks = (marks: Mark[]): void => {
		deleteFiles(marks, apiUrlCreator);
		deleteComments(marks, apiUrlCreator, articleProps.pathname, comments);
	};

	const onAddMarks = (marks: Mark[]): void => {
		addComments(marks, articleProps.pathname, comments);
	};

	const isEditExtensions = articleIsEdit ? [SelectionMenu] : [];

	const extensionsList = ExtensionUpdater.getUpdatedExtension([
		...extensions,
		OnDeleteNode.configure({ onDeleteNodes }),
		OnAddMark.configure({ onAddMarks }),
		OnDeleteMark.configure({ onDeleteMarks }),
		OnTitleLoseFocus.configure({ onTitleLoseFocus }),
		...isEditExtensions,
	]);

	useWatch(() => {
		EditorExtensionsService.value = extensionsList;
	}, [extensionsList]);

	const editor = useEditor(
		{
			content: JSON.parse(content) as JSONContent,
			extensions: [...extensionsList],
			injectCSS: false,
			editorProps: { handlePaste },
			onUpdate,
			onBlur,
			editable: articleIsEdit,
		},
		[content, apiUrlCreator, pageDataContext, articleProps.ref.path],
	);

	useEffect(() => {
		if (!editor) return;
		if (editor && !editor.state.doc.textContent) editor.commands.focus();
		if (editor) EditorService.bindEditor(editor);
	}, [editor]);

	return (
		<>
			{articleIsEdit && <Menu editor={editor} id={ContentEditorId} />}
			<EditorContent editor={editor} data-qa="article-editor" />
			<ArticleMat editor={editor} />
		</>
	);
};

export default ContentEditor;
