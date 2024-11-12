import { Editor } from "@tiptap/react";

export default abstract class EditorService {
	private static _editor: Editor;

	public static bindEditor(editor: Editor) {
		this._editor = editor;
	}

	public static getEditor(): Editor {
		return this._editor;
	}
}
