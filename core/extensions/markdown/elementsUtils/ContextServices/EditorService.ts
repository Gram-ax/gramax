import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { Router } from "@core/Api/Router";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { uniqueName } from "@core/utils/uniqueName";
import { pasteArticleResource } from "@ext/markdown/elements/copyArticles/copyPasteArticleResource";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import { PropertyService } from "@ext/properties/components/PropertyService";
import { Editor } from "@tiptap/core";
import { Slice } from "@tiptap/pm/model";
import { EditorView } from "prosemirror-view";

export interface BaseEditorContext {
	apiUrlCreator: ApiUrlCreator;
	articleProps: ClientArticleProps;
	propertyService?: PropertyService;
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

export interface EditorData {
	lastUsedHighlightColor: HIGHLIGHT_COLOR_NAMES;
}

export type EditorDataKey = keyof EditorData;
export type EditorDataValue = EditorData[EditorDataKey];

export default abstract class EditorService {
	private static _editor: Editor;
	private static _data: EditorData = {
		lastUsedHighlightColor: null,
	};

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

	public static createHandlePasteCallback(resourceService: ResourceServiceType): EditorPasteHandler {
		return (view, event, _slice, apiUrlCreator, articleProps) => {
			if (!event.clipboardData) return false;
			if (event.clipboardData.files.length !== 0)
				return imageHandlePaste(view, event, articleProps.fileName, resourceService);

			return pasteArticleResource({ view, event, apiUrlCreator, resourceService });
		};
	}

	public static createUpdateTitleFunction() {
		return async (context: BaseEditorContext, router: Router, title: string, fileName?: string) => {
			const { articleProps, apiUrlCreator } = context;

			articleProps.title = title;
			articleProps.fileName = fileName
				? uniqueName(fileName, await this._getBrotherFileNames(articleProps.ref.path, apiUrlCreator))
				: articleProps.fileName;

			const url = apiUrlCreator.updateItemProps();
			const res = await FetchService.fetch(
				url,
				JSON.stringify({
					...articleProps,
					properties: context.propertyService?.articleProperties.map((prop) => ({
						name: prop.name,
						value: prop.value,
					})),
				}),
				MimeTypes.json,
			);

			if (fileName && res.ok) {
				const { pathname, ref } = await res.json();
				articleProps.ref = ref;
				pathname && router.pushPath(pathname);
			}
		};
	}

	public static setData(key: EditorDataKey, value: EditorDataValue) {
		this._data[key] = value;
	}

	public static getData(key: EditorDataKey): EditorDataValue {
		return this._data?.[key];
	}

	private static async _getBrotherFileNames(articlePath: string, apiUrlCreator: ApiUrlCreator): Promise<string[]> {
		const response = await FetchService.fetch(apiUrlCreator.getArticleBrotherFileNames(articlePath));
		if (!response.ok) return;
		const data = (await response.json()) as string[];
		return data;
	}
}
