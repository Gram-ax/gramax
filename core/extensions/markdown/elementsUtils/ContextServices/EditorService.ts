import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { pasteArticleResource } from "@ext/markdown/elements/copyArticles/copyPasteArticleResource";
import { OnLoadResource } from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
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

	public static bindEditor(editor: Editor) {
		this._editor = editor;
	}

	public static getEditor(): Editor {
		return this._editor;
	}

	public static createOnUpdateCallback(): (editorContext: EditorContext) => Promise<void> {
		return async (editorContext: EditorContext) => {
			const { editor, apiUrlCreator } = editorContext;
			const json = editor.getJSON();
			json.content.shift();
			const articleContentEdit = JSON.stringify(json);
			const url = apiUrlCreator.updateArticleContent();
			await FetchService.fetch(url, articleContentEdit, MimeTypes.json);
		};
	}

	public static createHandlePasteCallback(onLoadResource: OnLoadResource): EditorPasteHandler {
		return (view, event, _slice, apiUrlCreator, articleProps) => {
			if (!event.clipboardData) return false;
			if (event.clipboardData.files.length !== 0)
				return imageHandlePaste(view, event, articleProps, apiUrlCreator, onLoadResource);

			return pasteArticleResource({ view, event, articleProps, apiUrlCreator, onLoadResource });
		};
	}
}
