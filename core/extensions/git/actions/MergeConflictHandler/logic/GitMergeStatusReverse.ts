import GitMergeStatus from "@ext/git/actions/MergeConflictHandler/model/GitMergeStatus";

const reverseMergeStatus = (mergeType: GitMergeStatus): GitMergeStatus => {
	switch (mergeType) {
		case GitMergeStatus.AddedByThem:
			return GitMergeStatus.AddedByUs;
		case GitMergeStatus.AddedByUs:
			return GitMergeStatus.AddedByThem;
		case GitMergeStatus.DeletedByThem:
			return GitMergeStatus.DeletedByUs;
		case GitMergeStatus.DeletedByUs:
			return GitMergeStatus.DeletedByThem;
		case GitMergeStatus.BothModified:
			return GitMergeStatus.BothModified;
		case GitMergeStatus.BothDeleted:
			return GitMergeStatus.BothDeleted;
		case GitMergeStatus.BothAdded:
			return GitMergeStatus.BothAdded;
	}
};

export default reverseMergeStatus;
