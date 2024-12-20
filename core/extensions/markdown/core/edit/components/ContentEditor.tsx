import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import useWatch from "@core-ui/hooks/useWatch";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import OnTitleLoseFocus from "@ext/markdown/elements/article/edit/OnTitleLoseFocus";
import CopyArticles from "@ext/markdown/elements/copyArticles/copyArticles";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import EditorService, {
	BaseEditorContext,
	EditorContext,
	EditorPasteHandler,
} from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { Mark } from "@tiptap/pm/model";
import { EditorContent, Extensions, JSONContent, useEditor } from "@tiptap/react";
import { Node } from "prosemirror-model";
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
	onBlur: (editorContext: EditorContext) => void;
	onTitleLoseFocus: (props: { newTitle: string } & BaseEditorContext) => void;
	onUpdate: (editorContext: EditorContext) => void;
	handlePaste: EditorPasteHandler;
}

const ContentEditor = (props: ContentEditorProps) => {
	const { content, extensions, onBlur, onTitleLoseFocus, onUpdate, handlePaste } = props;

	const comments = CommentCounterService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const onLoadResource = OnLoadResourceService.value;
	const pageDataContext = PageDataContextService.value;

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
		addComments(marks, articleProps.pathname, comments, pageDataContext.userInfo);
	};

	const extensionsList = ExtensionUpdater.getUpdatedExtension([
		...extensions,
		OnDeleteNode.configure({ onDeleteNodes }),
		OnAddMark.configure({ onAddMarks }),
		CopyArticles.configure({ onLoadResource }),
		OnDeleteMark.configure({ onDeleteMarks }),
		OnTitleLoseFocus.configure({
			onTitleLoseFocus: ({ newTitle }) => onTitleLoseFocus({ newTitle, apiUrlCreator, articleProps }),
		}),
		SelectionMenu,
	]);

	useWatch(() => {
		EditorExtensionsService.value = extensionsList;
		EditorService.bindOnUpdate(onUpdate);
		EditorService.bindOnBlur(onBlur);
		EditorService.bindHandlePaste(handlePaste);
	}, [extensionsList, onUpdate, onBlur, handlePaste]);

	const editor = useEditor(
		{
			content: JSON.parse(content) as JSONContent,
			extensions: [...extensionsList],
			injectCSS: false,
			editorProps: {
				handlePaste: (view, event, slice) => handlePaste(view, event, slice, apiUrlCreator, articleProps),
			},
			onUpdate: ({ editor }) => onUpdate({ editor, apiUrlCreator, articleProps }),
			onBlur: ({ editor }) => onBlur({ editor, apiUrlCreator, articleProps }),
			editable: true,
		},
		[content, apiUrlCreator, pageDataContext, articleProps.ref.path],
	);

	useEffect(() => {
		if (!editor) return;
		if (editor && !editor.state.doc.textContent) editor.commands.focus();
		if (editor) EditorService.bindEditor(editor);
	}, [editor]);

	useEffect(() => {
		if (editor) {
			const copyArticlesExtension = editor.extensionManager.extensions.find((ext) => ext.name === "copyArticles");
			if (copyArticlesExtension) copyArticlesExtension.options.onLoadResource = onLoadResource;
		}
	}, [onLoadResource.data]);

	return (
		<>
			<Menu editor={editor} id={ContentEditorId} />
			<EditorContent editor={editor} data-qa="article-editor" data-iseditable={true} />
			<ArticleMat editor={editor} />
		</>
	);
};

export default ContentEditor;
