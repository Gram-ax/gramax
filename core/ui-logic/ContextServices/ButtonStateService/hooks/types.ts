import { editName as blockFieldEditName } from "@ext/markdown/elements/blockContentField/consts";
import { editName as blockPropertyEditName } from "@ext/markdown/elements/blockProperty/consts";
import { Level } from "@ext/markdown/elements/heading/edit/model/heading";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import { Selection } from "@tiptap/pm/state";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import DiagramType from "@core/components/Diagram/DiagramType";
import { editName as questionEditName } from "@ext/markdown/elements/question/consts";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";

export type Attrs = {
	level: Level;
	type?: Exclude<NoteType, "hotfixes">;
	diagramName?: DiagramType;
	color?: HIGHLIGHT_COLOR_NAMES;
};

export type NodeType =
	| "html"
	| "view"
	| "heading"
	| "paragraph"
	| "blockquote"
	| "orderedList"
	| "bulletList"
	| "taskList"
	| "table"
	| "cut"
	| "note"
	| "tabs"
	| "snippet"
	| "diagramsMenuGroup"
	| "drawio"
	| "diagrams"
	| "image"
	| "icon"
	| "video"
	| typeof OPEN_API_NAME
	| "code_block"
	| "inline-property"
	| typeof blockFieldEditName
	| typeof blockPropertyEditName
	| typeof questionEditName;

export type Mark = "link" | "strong" | "em" | "code" | "file" | "comment" | "s" | "highlight";

export interface NodeValues {
	action?: NodeType;
	mark?: Mark;
	attrs?: Partial<Attrs>;
}

export interface ActionContextValue {
	actions: NodeType[];
	marks: Mark[];
	attrs: Partial<Attrs>;
	selection: Selection;
}

export interface ButtonState {
	isActive: boolean;
	disabled: boolean;
}
