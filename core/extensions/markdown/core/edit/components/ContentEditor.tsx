import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import { Editor } from "@tiptap/core";
import { Mark } from "@tiptap/pm/model";
import { EditorContent, Extensions, JSONContent, useEditor } from "@tiptap/react";
import { Node, Slice } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { DependencyList } from "react";
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
import ExtensionUpdater from "../../../elementsUtils/editExtensionUpdator/ExtensionUpdater";
import ContextWrapper from "./ContextWrapper";
import Menu from "./Menu/Menu";

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

	const onDeleteNodes = (nodes: Node[]): void => {
		deleteImages(nodes, apiUrlCreator);
		deleteDrawio(nodes, apiUrlCreator);
		deleteDiagrams(nodes, apiUrlCreator);
	};

	const onDeleteMarks = (marks: Mark[]): void => {
		deleteFiles(marks, apiUrlCreator);
		deleteComments(marks, apiUrlCreator, articleProps.path, comments);
	};

	const onAddMarks = (marks: Mark[]): void => {
		addComments(marks, articleProps.path, comments);
	};

	const editor = useEditor(
		{
			content: JSON.parse(content) as JSONContent,
			extensions: ExtensionUpdater.getUpdatedExtension([
				...extensions,
				OnDeleteNode.configure({ onDeleteNodes }),
				OnAddMark.configure({ onAddMarks }),
				OnDeleteMark.configure({ onDeleteMarks }),
				SelectionMenu,
			]),
			injectCSS: false,
			editorProps: { handlePaste },
			onCreate,
			onUpdate,
			onSelectionUpdate,
			onBlur,
		},
		[content, isMac, apiUrlCreator, pageDataContext, articleProps.ref.path, ...deps],
	);

	return (
		<ContextWrapper editor={editor}>
			<Menu editor={editor} />
			<EditorContent editor={editor} />
		</ContextWrapper>
	);
};

export default ContentEditor;
