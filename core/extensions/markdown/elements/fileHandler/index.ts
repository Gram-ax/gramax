import createFile from "@ext/markdown/elements/file/edit/logic/createFile";
import createImages from "@ext/markdown/elements/image/edit/logic/createImages";
import { getEditorContext } from "@ext/markdown/elementsUtils/editorContext/EditorContext";
import { feature } from "@ext/toggleFeatures/features";
import type { Editor } from "@tiptap/core";
import FileHandler from "@tiptap/extension-file-handler";
import { TextSelection } from "@tiptap/pm/state";

// Inserts files dropped from the OS into the article at the drop position. Images become image
// nodes, everything else becomes a file attachment. Services come from the editor context storage
// (set per-article), the same way the resource nodes read them.
const insertDroppedFiles = async (editor: Editor, files: File[], pos: number) => {
	const { resourceService, apiUrlCreator, articleProps } = getEditorContext(editor);
	if (!resourceService || !articleProps) return;

	const { view } = editor;
	view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(pos))));

	const images = files.filter((file) => file.type.startsWith("image/"));
	const others = files.filter((file) => !file.type.startsWith("image/"));

	if (images.length) await createImages(images, view, articleProps.fileName, resourceService);
	if (others.length) await createFile(others, view, apiUrlCreator, resourceService);
};

const FileDropHandler = FileHandler.configure({
	onDrop: (editor, files, pos) => {
		void insertDroppedFiles(editor, files, pos);
	},
});

export default FileDropHandler;
