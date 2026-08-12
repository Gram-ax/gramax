import type { Environment } from "@app/resolveModule/env";
import type PageDataContext from "@core/Context/PageDataContext";
import type { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type Theme from "@ext/Theme/Theme";
import { type Editor, Extension } from "@tiptap/core";
import type { MutableRefObject } from "react";

export interface EditorContextValue {
	theme?: Theme;
	isMac?: boolean;
	articleProps?: ClientArticleProps;
	catalogProps?: ClientCatalogProps;
	apiUrlCreator?: ApiUrlCreator;
	pageDataContext?: PageDataContext;
	articleRef?: MutableRefObject<HTMLDivElement>;
	resourceService?: ResourceServiceType;
	platform?: Environment;
	sourceData?: SourceData[];
}

declare module "@tiptap/core" {
	interface Storage {
		editorContext: EditorContextValue;
	}
}

export const EDITOR_CONTEXT_STORAGE_KEY = "editorContext";

export const getEditorContext = (editor: Editor): EditorContextValue => editor?.storage?.editorContext ?? {};

export const setEditorContext = (editor: Editor, value: Partial<EditorContextValue>): void => {
	if (!editor?.storage?.editorContext) return;
	Object.assign(editor.storage.editorContext, value);
};

export const EditorContextExtension = Extension.create<unknown, EditorContextValue>({
	name: "editorContext",

	addStorage() {
		return {};
	},
});
