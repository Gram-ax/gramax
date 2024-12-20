import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type { ApprovalSignature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import useStorage from "@ext/storage/logic/utils/useStorage";
import { useCallback, useState } from "react";

export const useApproval = ({ assignee }: { assignee: ApprovalSignature }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [approvedAt, setApprovedAt] = useState(assignee.approvedAt);
	const storage = useStorage();

	const setApprove = useCallback(async (approve: boolean) => {
		const res = await FetchService.fetch(apiUrlCreator.setMergeRequestApproval(approve));
		if (res.ok) setApprovedAt(await res.json());
		BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.MergeRequest);
	}, []);

	return {
		setApprove,
		approvedAt,
		canSetApprove: !!storage && assignee.email === storage.userEmail,
	};
};
