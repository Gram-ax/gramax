import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";

const haveConflictWithFileDelete = (gitMergeStatus: GitMergeStatus): boolean =>
	[
		GitMergeStatus.AddedByUs,
		GitMergeStatus.AddedByThem,
		GitMergeStatus.DeletedByUs,
		GitMergeStatus.DeletedByThem,
	].includes(gitMergeStatus);

export default haveConflictWithFileDelete;
