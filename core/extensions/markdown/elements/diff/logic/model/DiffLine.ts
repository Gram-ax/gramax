import { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";

export type Pos = { from: number; to: number };

interface AnyDiffLine {
	type: "added" | "deleted" | "modified";
	pos: Pos;
}

export interface AddedLine extends AnyDiffLine {
	type: "added";
}

export interface ModifiedLine extends AnyDiffLine {
	type: "modified";
	diff: {
		hunks: DiffHunk[];
		addedPartPositions: Pos[];
		deletedPartPositions: Pos[];
	};
	oldPos: Pos;
}

export interface DeletedLine extends AnyDiffLine {
	type: "deleted";
}

export type DiffLine = AddedLine | ModifiedLine | DeletedLine;

