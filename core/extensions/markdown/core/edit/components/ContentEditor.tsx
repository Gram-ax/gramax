import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorContent, Extensions, JSONContent, useEditor } from "@tiptap/react";
import { Node, Slice } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { DependencyList, useEffect } from "react";
import ApiUrlCreatorService from "../../../../../ui-logic/ContextServices/ApiUrlCreator";
import ArticlePropsService from "../../../../../ui-logic/ContextServices/ArticleProps";
import IsMacService from "../../../../../ui-logic/ContextServices/IsMac";
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
import ContextWrapper from "./ContextWrapper";
import Menu from "./Menu/Menu";

export const ContentEditorId = "ContentEditorId";

interface ContentEditorProps {
	content: string;
	extensions: Extensions;
	onCreate: () => void;
	onBlur: ({ editor }: { editor: Editor }) => void;
	onUpdate: ({ editor }: { editor: Editor }) => void;
	onSelectionUpdate: ({ editor }: { editor: Editor }) => void;
	handlePaste: (view: EditorView, event: ClipboardEvent, slice: Slice) => boolean | void;
	deps?: DependencyList;
}

const ContentEditor = (props: ContentEditorProps) => {
	const { content, extensions, onCreate, onBlur, onUpdate, onSelectionUpdate, handlePaste, deps } = props;

	const isMac = IsMacService.value;
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
	const editor = useEditor(
		{
			content: JSON.parse(content) as JSONContent,
			extensions: ExtensionUpdater.getUpdatedExtension([
				...extensions,
				OnDeleteNode.configure({ onDeleteNodes }),
				OnAddMark.configure({ onAddMarks }),
				OnDeleteMark.configure({ onDeleteMarks }),
				...isEditExtensions,
			]),
			injectCSS: false,
			editorProps: { handlePaste },
			onCreate,
			onUpdate,
			onSelectionUpdate,
			onBlur,
			editable: articleIsEdit,
		},
		[content, isMac, apiUrlCreator, pageDataContext, articleProps.ref.path, ...deps],
	);

	useEffect(() => {
		if (editor && !editor.state.doc.textContent) editor.commands.focus();
	}, [editor]);

	return (
		<>
			<ContextWrapper editor={editor}>
				{articleIsEdit && <Menu editor={editor} id={ContentEditorId} />}
				<EditorContent editor={editor} data-qa="article-editor" />
			</ContextWrapper>
			<ArticleMat editor={editor} />
		</>
	);
};

export default ContentEditor;
