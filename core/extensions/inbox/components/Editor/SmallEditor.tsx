import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import Path from "@core/FileProvider/Path/Path";
import InboxService from "@ext/inbox/components/InboxService";
import t from "@ext/localization/locale/translate";
import ArticleMat from "@ext/markdown/core/edit/components/ArticleMat";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import ArticleTitleHelpers from "@ext/markdown/elements/article/edit/ArticleTitleHelpers";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import Document from "@tiptap/extension-document";
import { Editor, EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { memo, useCallback } from "react";

interface SmallEditorProps {
	content: JSONContent;
	path: string;
	logicPath: string;
}

const getExtensions = (onTitleLoseFocus: (newTitle: string) => void) => [
	...getSimpleExtensions(),
	ArticleTitleHelpers.configure({
		onTitleLoseFocus: ({ newTitle }) => onTitleLoseFocus(newTitle),
	}),
	Document.extend({
		content: "paragraph block+",
	}),
	Placeholder.configure({
		placeholder: ({ editor, node }) => {
			if (editor.state.doc.firstChild.type.name === "paragraph" && editor.state.doc.firstChild === node)
				return t("inbox.placeholders.title");

			if (
				node.type.name === "paragraph" &&
				editor.state.doc.content.child(1) === node &&
				editor.state.doc.content.childCount === 2
			)
				return t("inbox.placeholders.content");
		},
	}),
];

const SmallEditor = ({ content, path, logicPath }: SmallEditorProps) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { selectedPath, notes } = InboxService.value;

	const updateContent = useCallback(
		async (content: JSONContent) => {
			if (selectedPath.length === 0) return;

			const selectedNote = notes.find((note) => logicPath === note.logicPath);
			if (!selectedNote) return;

			const curPath = new Path(path);
			const url = apiUrlCreator.updateFileInGramaxDir(curPath.name, "inbox");
			await FetchService.fetch(url, JSON.stringify({ content }), MimeTypes.json);

			selectedNote.content = getArticleWithTitle(selectedNote.title, content);
			InboxService.setNotes([...notes.filter((note) => note.logicPath !== logicPath), selectedNote]);
		},
		[logicPath, apiUrlCreator, selectedPath, notes],
	);

	const updateTitle = useCallback(
		async (title: string) => {
			if (selectedPath.length === 0) return;

			const selectedNote = notes.find((note) => logicPath === note.logicPath);
			if (!selectedNote) return;
			if (title === selectedNote?.title) return;

			const articleProps = {
				...selectedNote.props,
				title,
			};

			const curPath = new Path(path);
			const url = apiUrlCreator.updateFileInGramaxDir(curPath.name, "inbox");
			await FetchService.fetch(url, JSON.stringify({ props: articleProps }), MimeTypes.json);
			selectedNote.title = title;

			selectedNote.content.content.shift();
			selectedNote.content = getArticleWithTitle(title, selectedNote.content);

			InboxService.setNotes([...notes.filter((note) => note.logicPath !== logicPath), selectedNote]);
		},
		[logicPath, apiUrlCreator, selectedPath, notes],
	);

	const debouncedUpdateContent = useDebounce(updateContent, 500);
	const debouncedUpdateTitle = useDebounce(updateTitle, 500);

	const onUpdateContent = useCallback(
		({ editor }: { editor: Editor }) => {
			const json = editor.getJSON();
			json.content.shift();
			debouncedUpdateContent.cancel();
			debouncedUpdateContent.start(json);
		},
		[debouncedUpdateContent],
	);

	const onTitleLoseFocus = useCallback(
		(newTitle: string) => {
			debouncedUpdateTitle.cancel();
			debouncedUpdateTitle.start(newTitle);
		},
		[debouncedUpdateTitle],
	);

	const editor = useEditor(
		{
			onUpdate: onUpdateContent,
			content: content ?? { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] },
			injectCSS: false,
			extensions: getExtensions(onTitleLoseFocus),
			editable: true,
			autofocus: content.content.length === 2,
		},
		[],
	);

	return (
		<MinimizedArticleStyled>
			<div className="article">
				<EditorContent data-qa="article-editor" editor={editor} className={"article-body"} />
				<ArticleMat editor={editor} style={{ minHeight: "unset", height: "90%" }} />
			</div>
		</MinimizedArticleStyled>
	);
};

export default memo(SmallEditor);
