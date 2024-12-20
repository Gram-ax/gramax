import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { Editor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { EditorView } from "prosemirror-view";

export interface BaseEditorContext {
	apiUrlCreator: ApiUrlCreator;
	articleProps: ClientArticleProps;
}

export interface EditorContext {
	editor: Editor;
	apiUrlCreator: ApiUrlCreator;
	articleProps: ClientArticleProps;
}

export type EditorPasteHandler = (
	view: EditorView,
	event: ClipboardEvent,
	slice: Slice,
	apiUrlCreator: ApiUrlCreator,
	articleProps: ClientArticleProps,
) => boolean | void;

export default abstract class EditorService {
	private static _editor: Editor;
	private static onBlur: (editorContext: EditorContext) => void;
	private static onUpdate: (editorContext: EditorContext) => void;
	private static handlePaste: EditorPasteHandler;

	public static bindEditor(editor: Editor) {
		this._editor = editor;
	}

	public static getEditor(): Editor {
		return this._editor;
	}

	public static bindOnUpdate(onUpdate: (editorContext: EditorContext) => void) {
		this.onUpdate = onUpdate;
	}

	public static getOnUpdate(): (editorContext: EditorContext) => void {
		return this.onUpdate;
	}

	public static bindOnBlur(onBlur: (editorContext: EditorContext) => void) {
		this.onBlur = onBlur;
	}

	public static getOnBlur(): (editorContext: EditorContext) => void {
		return this.onBlur;
	}

	public static bindHandlePaste(handlePaste: EditorPasteHandler) {
		this.handlePaste = handlePaste;
	}

	public static getHandlePaste(): EditorPasteHandler {
		return this.handlePaste;
	}
}
