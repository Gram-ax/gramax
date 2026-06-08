import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import {
	revisionCatalogStore,
	useRevisionCatalogStore,
} from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { useCallback, useEffect, useRef, useState } from "react";

export const useRevisionsCompare = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	const abortControllerRef = useRef<AbortController>(null);

	useWatch(() => {
		apiUrlCreatorRef.current = apiUrlCreator;
	}, [apiUrlCreator]);

	const [isLoading, setIsLoading] = useState(false);

	const { revisionsCompare, setCompareDiffTree } = useRevisionCatalogStore((state) => ({
		revisionsCompare: state.revisionsCompare,
		setCompareDiffTree: state.setCompareDiffTree,
	}));

	const fetchCompareDiffTree = useCallback(
		async (fromOid: string, toOid: string) => {
			if (abortControllerRef.current) abortControllerRef.current.abort();
			abortControllerRef.current = new AbortController();

			setIsLoading(true);

			const [res] = await Promise.all([
				await FetchService.fetch<DiffTree>(
					apiUrlCreatorRef.current.getVersionControlDiffTreeUrl({ commit: fromOid }, { commit: toOid }),
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					abortControllerRef.current.signal,
				),
				new Promise((resolve) => setTimeout(resolve, 250)),
			]);
			setIsLoading(false);
			if (!res.ok) return;
			const data = await res.json();
			setCompareDiffTree(data);
		},
		[setCompareDiffTree],
	);

	const fromOid = revisionsCompare?.from?.oid ?? null;
	const toOid = revisionsCompare?.to?.oid ?? null;

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetch only when oids change
	useEffect(() => {
		const { from, to } = revisionCatalogStore.getState().revisionsCompare ?? {};
		if (!from || !to) {
			setCompareDiffTree(null);
			return;
		}
		const [older, newer] = from.timestamp < to.timestamp ? [from, to] : [to, from];
		void fetchCompareDiffTree(older.oid, newer.oid);
	}, [fromOid, toOid]);

	return { isLoading };
};
