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

interface CheckoutData {
	to: string;
}

export interface RepState {
	value: "default" | "mergeConflict" | "stashConflict" | "checkout";
	data?: MergeConflictData | StashconflictData | CheckoutData;
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

export interface RepCheckoutState extends RepState {
	value: "checkout";
	data: CheckoutData;
}
