import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";

export interface GitMergeResultContent extends GitMergeResult {
	content: string;
	title?: string;
}
