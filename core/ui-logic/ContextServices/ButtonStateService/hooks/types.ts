import { Level } from "@ext/markdown/elements/heading/edit/model/heading";

type Attrs = { level: Level; notFirstInList?: boolean };

type DiagramsGroup = "diagramsMenuGroup" | "drawio" | "Ts-diagram" | "C4-diagram" | "Plant-uml" | "diagrams.net";
type FilesGroup = "filesMenuGroup" | "image" | "video";

type Nodes = "heading" | "paragraph" | "note" | "blockquote" | "code_block" | "code" | "cut";
type List = "bullet_list" | "ordered_list";
type Table = "table" | "tableCell" | "tableHeader";

type Actions = Nodes | DiagramsGroup | FilesGroup | List | Table;

export type Mark = "link" | "strong" | "em" | "code" | "file" | "comment";

export interface NodeValues {
	action?: Actions | Actions[];
	mark?: Mark;
	attrs?: Attrs;
}

export interface ActionContextValue {
	action: string;
	marks: Mark[];
	attrs: Partial<Attrs>;
}
