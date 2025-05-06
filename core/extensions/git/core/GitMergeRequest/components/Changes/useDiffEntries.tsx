import type { MergeRequestDiffTree } from "@app/commands/mergeRequests/getDiffTree";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import { DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { useCallback, useEffect, useRef, useState } from "react";

export const useDiffEntries = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [changes, setChanges] = useState<MergeRequestDiffTree>(null);
	const [stage, setLoadStage] = useState(DiffEntriesLoadStage.NotLoaded);
	const prevRefs = useRef<{ sourceRef: string; targetRef: string }>({
		sourceRef: null,
		targetRef: null,
	});

	const requestChanges = useCallback(
		(sourceRef: string, targetRef: string) => {
			return (async () => {
				if (prevRefs.current.sourceRef && prevRefs.current.targetRef) {
					const cleanupUrl = apiUrlCreator.cleanupReferencesDiff(
						prevRefs.current.sourceRef,
						prevRefs.current.targetRef,
					);
					await FetchService.fetch(cleanupUrl);
				}
				prevRefs.current = { sourceRef, targetRef };
				setLoadStage(DiffEntriesLoadStage.Loading);
				try {
					const url = apiUrlCreator.mergeRequestDiffTree(sourceRef, targetRef);
					const res = await FetchService.fetch(url);
					if (res.ok) {
						const data = await res.json();
						setChanges(data);
						setLoadStage(DiffEntriesLoadStage.Ready);
						await FetchService.fetch(apiUrlCreator.mountReferencesDiff(sourceRef, targetRef));
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
		const handler = (branch: GitBranchData, reason: OnBranchUpdateCaller) =>
			branch.mergeRequest &&
			(reason === OnBranchUpdateCaller.Init ||
				reason === OnBranchUpdateCaller.Checkout ||
				reason === OnBranchUpdateCaller.Publish) &&
			(stage === DiffEntriesLoadStage.Ready || stage === DiffEntriesLoadStage.Loading) &&
			requestChanges(branch.mergeRequest.sourceBranchRef, branch.mergeRequest.targetBranchRef);

		BranchUpdaterService.addListener(handler);
		return () => BranchUpdaterService.removeListener(handler);
	}, [requestChanges, stage]);

	useEffect(() => {
		const handler = async () => {
			let mr = BranchUpdaterService.branch.mergeRequest;
			if (!mr) {
				const url = apiUrlCreator.getDraftMergeRequest();
				const res = await FetchService.fetch(url);
				mr = await res.json();
			}
			if (!mr) return;
			await requestChanges(mr.sourceBranchRef, mr.targetBranchRef);
		};
		void handler();
	}, []);

	return {
		changes: changes?.diffTree,
		stage,
	};
};
