import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";

interface MergeConflictData {
	deleteAfterMerge: boolean;
	theirs: string;
	conflictFiles: GitMergeResult[];
	reverseMerge: boolean;
	branchNameBefore?: string;
}

interface StashconflictData {
	stashHash: string;
	reverseMerge: true;
	conflictFiles: GitMergeResult[];
	commitHeadBefore: string;
}

export interface RepState {
	value: "default" | "mergeConflict" | "stashConflict";
	data?: MergeConflictData | StashconflictData;
}

export interface RepDefaultState extends RepState {
	value: "default";
}

export interface RepMergeConflictState extends RepState {
	value: "mergeConflict";
	data: MergeConflictData;
}

export interface RepStashConflictState extends RepState {
	value: "stashConflict";
	data: StashconflictData;
}
