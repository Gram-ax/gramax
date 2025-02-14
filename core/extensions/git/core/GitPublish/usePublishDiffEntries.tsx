import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import useWatch from "@core-ui/hooks/useWatch";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import type { DiffTree, TotalOverview } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
import { useCallback, useEffect, useState } from "react";

export type UsePublishDiffEntries = {
	diffTree?: DiffTree;
	overview: TotalOverview;

	isEntriesLoading: boolean;
	isEntriesReady: boolean;

	resetDiffTree: () => void;
};

const usePublishDiffEntries = ({ autoUpdate }: { autoUpdate?: boolean }): UsePublishDiffEntries => {
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [diffTree, setDiffTree] = useState<DiffTree>(null);
	const [isEntriesLoading, setIsEntriesLoading] = useState(false);
	const [isEntriesReady, setIsEntriesReady] = useState(false);

	const overview = GitIndexService.getOverview();

	const request = useCallback(async () => {
		const timeout = setTimeout(() => setIsEntriesLoading(true), 150);

		const url = apiUrlCreator.getVersionControlDiffTreeUrl();
		const res = await FetchService.fetch<DiffTree>(url);

		clearTimeout(timeout);
		if (res.ok) {
			setDiffTree(await res.json());
			setIsEntriesReady(true);
		} else {
			setDiffTree(null);
		}

		setIsEntriesLoading(false);
	}, []);

	useWatch(() => {
		if (!overview || !diffTree?.overview) return;

		request();
	}, [overview, request]);

	useEffect(() => {
		if (!autoUpdate) return;

		BranchUpdaterService.addListener(request);
		return () => BranchUpdaterService.removeListener(request);
	}, [autoUpdate, request]);

	const resetDiffTree = useCallback(() => request(), [setDiffTree, request]);

	return { diffTree, overview: overview, isEntriesLoading, isEntriesReady, resetDiffTree };
};

export default usePublishDiffEntries;
