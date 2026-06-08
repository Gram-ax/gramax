import type { DiffAstComment } from "@ext/git/core/Diff/logic/commentsDiff/CommentsDiff";
import type { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";

export type Pos = { from: number; to: number };

export type DiffLineType = "added" | "deleted" | "modified" | "comment" | "breadcrumb";

interface AnyDiffLine {
	type: DiffLineType;
	pos: Pos;
}

export interface AddedDiffLine extends AnyDiffLine {
	type: "added";
}

export interface ModifiedDiffLine extends AnyDiffLine {
	type: "modified";
	diff: {
		hunks: DiffHunk[];
		addedPartPositions: Pos[];
		deletedPartPositions: Pos[];
	};
	oldPos: Pos;
}

export interface DeletedDiffLine extends AnyDiffLine {
	type: "deleted";
	insertAfter: number;
}

export interface BreadcrumbDiffLine extends AnyDiffLine {
	type: "breadcrumb";
	diff: {
		hunks: DiffHunk[];
	};
}

export interface CommentDiffLine extends AnyDiffLine {
	type: "comment";
	comments: DiffAstComment[];
}

export type DiffLine = AddedDiffLine | ModifiedDiffLine | DeletedDiffLine | CommentDiffLine;
