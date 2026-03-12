import { MergeRequestStatus } from "@ext/git/core/GitMergeRequest/components/Elements/Status";
import { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";

const getMrStatus = (mr: MergeRequest, isDraft: boolean): MergeRequestStatus => {
	if (!mr) return null;
	if (isDraft) return "draft";
	if (mr.approvers.every((a) => a.approvedAt)) return "approved";
	return "in-progress";
};

export default getMrStatus;
