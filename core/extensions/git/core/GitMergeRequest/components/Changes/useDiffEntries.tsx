import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import { WithMergeBase } from "@ext/VersionControl/model/Diff";
import { useCallback, useEffect, useRef, useState } from "react";

export const useDiffEntries = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [changes, setChanges] = useState<WithMergeBase<DiffTree>>(null);
	const [stage, setLoadStage] = useState(DiffEntriesLoadStage.NotLoaded);
	const gitStatus = GitIndexService.getStatus();
	const mergeRequest = useRef<MergeRequest>(null);

	const requestChanges = useCallback(
		(targetRef: string) => {
			return (async () => {
				setLoadStage(DiffEntriesLoadStage.Loading);
				try {
					const url = apiUrlCreator.getVersionControlDiffTreeUrl({ reference: targetRef });
					const res = await FetchService.fetch<WithMergeBase<DiffTree>>(url);
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
		},
		[apiUrlCreator],
	);

	useEffect(() => {
		const handler = (branch: GitBranchData, reason: OnBranchUpdateCaller) => {
			if (
				branch.mergeRequest &&
				(reason === OnBranchUpdateCaller.Init ||
					reason === OnBranchUpdateCaller.Checkout ||
					reason === OnBranchUpdateCaller.Publish) &&
				(stage === DiffEntriesLoadStage.Ready || stage === DiffEntriesLoadStage.Loading)
			) {
				mergeRequest.current = branch.mergeRequest;
				requestChanges(branch.mergeRequest.targetBranchRef);
			}
		};
		BranchUpdaterService.addListener(handler);
		return () => BranchUpdaterService.removeListener(handler);
	}, [requestChanges, stage]);

	useEffect(() => {
		if (!mergeRequest.current) return;
		requestChanges(mergeRequest.current.targetBranchRef);
	}, [gitStatus, requestChanges]);

	useEffect(() => {
		const handler = async () => {
			let mr = BranchUpdaterService.branch.mergeRequest;
			if (!mr) {
				const url = apiUrlCreator.getDraftMergeRequest();
				const res = await FetchService.fetch(url);
				mr = await res.json();
			}
			if (!mr) return;
			mergeRequest.current = mr;
			await requestChanges(mr.targetBranchRef);
		};
		void handler();
	}, []);

	return {
		changes,
		stage,
	};
};
