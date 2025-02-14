import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type { ApprovalSignature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import useStorage from "@ext/storage/logic/utils/useStorage";
import { useCallback } from "react";

export const useApproval = ({ approver }: { approver: ApprovalSignature }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const storage = useStorage();

	const setApprove = useCallback(async (approve: boolean) => {
		await FetchService.fetch(apiUrlCreator.setMergeRequestApproval(approve));
		BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.MergeRequest);
	}, []);

	return {
		setApprove,
		canSetApprove: !!storage && approver.email === storage.userEmail,
	};
};
