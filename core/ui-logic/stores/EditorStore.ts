import type { ClientArticleProps, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type { Level as HeadingLevel } from "@ext/markdown/elements/heading/edit/model/heading";
import type { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import type { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import type { PropertyService } from "@ext/properties/components/PropertyService";
import type { Editor } from "@tiptap/core";
import type { Slice } from "@tiptap/pm/model";
import type { EditorView } from "prosemirror-view";
import { createStore } from "zustand";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

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
	catalogProps: ClientCatalogProps,
) => boolean;

export type LastUsedDiagramType = "mermaid" | "plant-uml" | "drawio" | "openapi";

interface EditorServiceState {
	editor: Editor | null;
	commentEnabled: boolean;
	review: boolean;
	lastUsedHighlightColor: HIGHLIGHT_COLOR_NAMES;
	lastUsedHeadingLevel: HeadingLevel;
	lastUsedListType: "bullet" | "ordered" | "task";
	lastUsedNoteType: Exclude<NoteType, "hotfixes">;
	lastUsedDiagramType: LastUsedDiagramType;
	toolbarWidth: number;
	isSmallEditor: boolean;
	search: {
		findText: string;
		replaceText: string;
		caseSensitive: boolean;
		wholeWord: boolean;
		replaceIsOpen: boolean;
	};
}

const editorStore = createStore<EditorServiceState>()(() => ({
	editor: null,
	commentEnabled: false,
	review: false,
	lastUsedHighlightColor: null,
	lastUsedHeadingLevel: null,
	lastUsedListType: null,
	lastUsedNoteType: null,
	lastUsedDiagramType: null,
	toolbarWidth: 0,
	isSmallEditor: false,
	search: {
		findText: "",
		replaceText: "",
		caseSensitive: false,
		wholeWord: false,
		replaceIsOpen: false,
	},
}));

export const useEditorStore = <T>(selector: (state: EditorServiceState) => T): T => {
	return useStoreWithEqualityFn(editorStore, selector, shallow);
};

export const getEditorStore = (): EditorServiceState => editorStore.getState();

export const setEditorStore = (patch: Partial<EditorServiceState>) => editorStore.setState(patch);

export const bindEditor = (editor: Editor) => {
	const commentExtension = editor?.options?.extensions.find((ext) => ext.name === "comment");
	editorStore.setState({
		editor,
		commentEnabled: commentExtension ? commentExtension.options.enabled : false,
	});
};
