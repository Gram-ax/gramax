import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import type { DiffTree, TotalOverview } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import PublishChangesProvider from "@ext/git/core/GitPublish/PublishChangesProvider";
import { useCallback, useEffect, useRef, useState } from "react";

export type UsePublishDiffEntries = {
	diffTree?: DiffTree;
	overview: TotalOverview;

	isEntriesLoading: boolean;
	isEntriesReady: boolean;

	resetDiffTree: () => void;
};

const usePublishDiffEntries = ({ autoUpdate }: { autoUpdate?: boolean }): UsePublishDiffEntries => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogName = useCatalogPropsStore((state) => state.data.name);

	const [diffTree, setDiffTree] = useState<DiffTree>(null);
	const [isEntriesLoading, setIsEntriesLoading] = useState(false);
	const [isEntriesReady, setIsEntriesReady] = useState(false);

	const apiUrlCreatorRef = useRef<ApiUrlCreator>(apiUrlCreator);

	useWatch(() => {
		apiUrlCreatorRef.current = apiUrlCreator;
	}, [apiUrlCreator]);

	const overview = GitIndexService.getOverview();
	const gitStatus = GitIndexService.getStatus();

	// useWatch do react warning: bad state update
	useEffect(() => {
		if (!diffTree) return;
		PublishChangesProvider.value = diffTree.data;
	}, [diffTree]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: It is recreated when changing the catalog - for example, when opening a link from a browser
	const request = useCallback(async () => {
		const timeout = setTimeout(() => setIsEntriesLoading(true), 150);

		const url = apiUrlCreatorRef.current.getVersionControlDiffTreeUrl("HEAD");
		const res = await FetchService.fetch<DiffTree>(url);

		clearTimeout(timeout);
		if (res.ok) {
			setDiffTree(await res.json());
			setIsEntriesReady(true);
		} else {
			setDiffTree(null);
		}

		setIsEntriesLoading(false);
	}, [catalogName]);

	useWatch(() => {
		if (!autoUpdate) return;
		if (!gitStatus?.size) {
			setDiffTree(null);
			return;
		}
		request();
	}, [gitStatus, request, autoUpdate]);

	useEffect(() => {
		if (!autoUpdate) return;

		BranchUpdaterService.addListener(request);
		return () => BranchUpdaterService.removeListener(request);
	}, [autoUpdate, request]);

	const resetDiffTree = useCallback(() => request(), [request]);

	return { diffTree, overview, isEntriesLoading, isEntriesReady, resetDiffTree };
};

export default usePublishDiffEntries;
