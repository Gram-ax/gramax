import type { MergeRequestDiffTree } from "@app/commands/mergeRequests/getDiffTree";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import { DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { useCallback, useEffect, useState } from "react";

export const useDiffEntries = (targetBranch: string, sourceBranch: string) => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [changes, setChanges] = useState<MergeRequestDiffTree>(null);
	const [stage, setLoadStage] = useState(DiffEntriesLoadStage.NotLoaded);

	const requestChanges = useCallback(() => {
		void (async () => {
			setLoadStage(DiffEntriesLoadStage.Loading);
			try {
				const url = apiUrlCreator.mergeRequestDiffTree(sourceBranch, targetBranch);
				const res = await FetchService.fetch(url);
				if (res.ok) {
					const data = await res.json();
					setChanges(data);
					setLoadStage(DiffEntriesLoadStage.Ready);
				} else {
					setLoadStage(DiffEntriesLoadStage.NotLoaded);
				}
			} catch {
				setLoadStage(DiffEntriesLoadStage.NotLoaded);
			}
		})();
	}, [targetBranch, sourceBranch, apiUrlCreator]);

	useEffect(() => {
		const handler = (branch: GitBranchData, reason: OnBranchUpdateCaller) =>
			branch.mergeRequest &&
			reason !== OnBranchUpdateCaller.MergeRequest &&
			(stage === DiffEntriesLoadStage.Ready || stage === DiffEntriesLoadStage.Loading) &&
			requestChanges();

		BranchUpdaterService.addListener(handler);
		return () => BranchUpdaterService.removeListener(handler);
	}, [stage, requestChanges]);

	return {
		changes: changes?.diffTree,
		stage,
		requestChanges,
	};
};
