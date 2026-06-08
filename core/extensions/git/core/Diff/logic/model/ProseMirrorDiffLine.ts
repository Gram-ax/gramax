import type {
	AddedDiffLine,
	BreadcrumbDiffLine,
	CommentDiffLine,
	DeletedDiffLine,
	ModifiedDiffLine,
} from "@ext/git/core/Diff/logic/model/DiffLine";
import type { JSONContent } from "@tiptap/core";
import type { Decoration } from "prosemirror-view";

type OldContent = {
	oldContent: JSONContent;
	oldDecorations: Decoration[];
};

export type ProseMirrorModifiedDiffLine = ModifiedDiffLine & OldContent;

export type ProseMirrorDeletedDiffLine = DeletedDiffLine & OldContent;

export type ProseMirrorBreadcrumbDiffLine = BreadcrumbDiffLine & OldContent;

export type ProseMirrorDiffLine =
	| AddedDiffLine
	| ProseMirrorModifiedDiffLine
	| ProseMirrorDeletedDiffLine
	| CommentDiffLine
	| ProseMirrorBreadcrumbDiffLine;
