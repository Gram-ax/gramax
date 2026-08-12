import type {
	AddedDiffLine,
	BreadcrumbDiffLine,
	CommentDiffLine,
	DeletedDiffLine,
	ModifiedDiffLine,
} from "@ext/git/core/Diff/logic/model/DiffLine";
import type { JSONContent } from "@tiptap/core";
import type { Decoration } from "prosemirror-view";

type ChangedContent = {
	oldContent: JSONContent;
	newContent: JSONContent;
	/** @deprecated used only by the legacy diff renderer (feature flag `new-diffs` off) */
	oldDecorations: Decoration[];
};

export type ProseMirrorModifiedDiffLine = ModifiedDiffLine & ChangedContent;

export type ProseMirrorDeletedDiffLine = DeletedDiffLine & ChangedContent;

export type ProseMirrorBreadcrumbDiffLine = BreadcrumbDiffLine & ChangedContent;

export type ProseMirrorDiffLine =
	| AddedDiffLine
	| ProseMirrorModifiedDiffLine
	| ProseMirrorDeletedDiffLine
	| CommentDiffLine
	| ProseMirrorBreadcrumbDiffLine;
