import { AddedDiffLine, CommentDiffLine, DeletedDiffLine, ModifiedDiffLine } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import { JSONContent } from "@tiptap/core";
import { Decoration } from "prosemirror-view";

type OldContent = {
	oldContent: JSONContent;
	oldDecorations: Decoration[];
};

export type ProseMirrorModifiedDiffLine = ModifiedDiffLine & OldContent;

export type ProseMirrorDeletedDiffLine = DeletedDiffLine & OldContent;

export type ProseMirrorDiffLine = AddedDiffLine | ProseMirrorModifiedDiffLine | ProseMirrorDeletedDiffLine | CommentDiffLine;
