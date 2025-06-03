import { AddedLine, DeletedLine, ModifiedLine } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { JSONContent } from "@tiptap/core";
import { Decoration } from "prosemirror-view";

export interface ProseMirrorModifiedDiffLine extends ModifiedLine {
	oldContent: JSONContent;
	oldDecorations: Decoration[];
}

export type ProseMirrorDiffLine = AddedLine | ProseMirrorModifiedDiffLine | DeletedLine;
