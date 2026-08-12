import type { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import BranchUpdaterService, {
	type OnBranchUpdateListener,
} from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import { PublishEmitter } from "@ext/git/actions/Publish/logic/PublishEmitter";
import {
	revisionCatalogStore,
	useRevisionCatalogStore,
} from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import { getNewCommitOidFromPathname } from "@ext/git/actions/Revisions/logic/utils/getCommitOidFromPathname";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import type { GitVersionDataSet } from "@ext/git/core/GitVersionControl/GitVersionControl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseRevisionsCatalogTabProps {
	show: boolean;
	setShow: (show: boolean) => void;
	navigationBottomTab: LeftNavigationTab;
}

export const useRevisionsCatalogTab = ({ show, setShow, navigationBottomTab }: UseRevisionsCatalogTabProps) => {
	const router = useRouter();

	const {
		revision,
		diffTree,
		revisions,
		reachedFirstCommit,
		filters,
		setScrollY,
		setDiffTree,
		setRevision,
		setRevisions,
		setReachedFirstCommit,
		setStatus,
		setRevisionsCompare,
		setCompareDiffTree,
		setFilters,
	} = useRevisionCatalogStore((state) => ({
		revision: state.revision,
		diffTree: state.diffTree,
		revisions: state.revisions,
		reachedFirstCommit: state.reachedFirstCommit,
		setRevision: state.setRevision,
		setDiffTree: state.setDiffTree,
		setRevisions: state.setRevisions,
		setReachedFirstCommit: state.setReachedFirstCommit,
		filters: state.filter,
		setStatus: state.setStatus,
		setRevisionsCompare: state.setRevisionsCompare,
		setCompareDiffTree: state.setCompareDiffTree,
		setScrollY: state.setScrollY,
		setFilters: state.setFilter,
	}));

	const [latestCommitOid, setLatestCommitOid] = useState<string>(null);
	const [isDiffTreeLoading, setIsDiffTreeLoading] = useState(false);
	const [showDiff, setShowDiff] = useState(false);
	const catalogName = useCatalogPropsStore((state) => state?.data?.name?.split(":")?.[0]?.split("~")?.[0]);
	const abortControllerRef = useRef<AbortController>(null);

	const apiUrlCreator = ApiUrlCreatorService.value;
	const apiUrlCreatorRef = useRef(apiUrlCreator);

	useWatch(() => {
		apiUrlCreatorRef.current = apiUrlCreator;
	}, [apiUrlCreator]);

	const requestDiffTree = useCallback(
		async (oid: string, parentOid?: string) => {
			if (abortControllerRef.current) abortControllerRef.current.abort();
			abortControllerRef.current = new AbortController();

			setIsDiffTreeLoading(true);
			const oldScope = parentOid ? { commit: parentOid } : "HEAD";

			// Adding delay to avoid flickering

			const [res] = await Promise.all([
				await FetchService.fetch<DiffTree>(
					apiUrlCreatorRef.current.getVersionControlDiffTreeUrl(oldScope, { commit: oid }),
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					abortControllerRef.current.signal,
				),
				new Promise((resolve) => setTimeout(resolve, 250)),
			]);
			setIsDiffTreeLoading(false);
			if (!res.ok) return;
			const data = await res.json();
			setDiffTree(data);
		},
		[setDiffTree],
	);

	const getRevisions = useCallback(
		async (from?: string, depth = 51) => {
			const newFilters = { ...filters, paths: filters?.articles?.map((a) => a.path) };
			delete newFilters.articles;
			if (!newFilters.paths?.length) delete newFilters.paths;

			const res = await FetchService.fetch<GitVersionDataSet>(
				apiUrlCreatorRef.current.getVersionControlRevisionsUrl(from, depth),
				JSON.stringify(newFilters),
			);
			if (!res.ok) return [];
			const data = await res.json();
			setReachedFirstCommit(data.reachedFirstCommit);
			return data.data;
		},
		[setReachedFirstCommit, filters],
	);

	const requestMore = useCallback(
		async (lastRevision: string) => {
			const newRevisions = await getRevisions(lastRevision);
			setRevisions([...(revisions ?? []), ...newRevisions]);
		},
		[getRevisions, revisions, setRevisions],
	);

	const onCompareClick = useCallback(
		(oid: string) => {
			const revisionData = revisions?.find((r) => r.oid === oid);
			if (!revisionData) return;

			const revisionsCompare = revisionCatalogStore.getState().revisionsCompare;
			const { from, to } = revisionsCompare ?? {};

			let newFrom = from;
			let newTo = to;

			if (from?.oid === oid) newFrom = null;
			else if (to?.oid === oid) newTo = null;
			else if (!from) newFrom = revisionData;
			else newTo = revisionData;

			setRevisionsCompare({ from: newFrom, to: newTo });
		},
		[revisions, setRevisionsCompare],
	);

	const onRevisionClick = useCallback(
		(oid: string) => {
			if (!oid) return;
			const status = revisionCatalogStore.getState().status;
			if (status === "comparing") return onCompareClick(oid);

			const isSameRevision = revision?.oid === oid;
			setRevision(oid);
			setShowDiff(true);
			if (isSameRevision) {
				const revisionData = revisions?.find((r) => r.oid === oid);
				if (revisionData) void requestDiffTree(revisionData.oid, revisionData.parents?.[0]);
			}
		},
		[setRevision, revision, revisions, requestDiffTree, onCompareClick],
	);

	const fetchHeadCommitOid = useCallback(async (): Promise<string | null> => {
		const res = await FetchService.fetch<GitVersionDataSet>(
			apiUrlCreatorRef.current.getVersionControlRevisionsUrl(undefined, 1),
			JSON.stringify({}),
		);
		if (!res.ok) return null;
		const data = await res.json();
		return data.data?.[0]?.oid ?? null;
	}, []);

	const onOpen = useCallback(async () => {
		if (revisions) return;

		const [newRevisions, headOid] = await Promise.all([getRevisions(), fetchHeadCommitOid()]);
		if (!latestCommitOid) setLatestCommitOid(headOid);

		if (!revision && newRevisions?.[0]) {
			const path = router.path;
			const commitOid = getNewCommitOidFromPathname(path) ?? newRevisions[0].oid;
			setRevision(commitOid);
		}

		setRevisions(newRevisions);
	}, [getRevisions, fetchHeadCommitOid, router, setRevision, setRevisions, revisions, revision, latestCommitOid]);

	const onClose = useCallback(async () => {
		setRevision(null);
		setDiffTree(null);
		setCompareDiffTree(null);
		setIsDiffTreeLoading(false);
		setShowDiff(false);
		setRevisionsCompare(null);
		setStatus("default");
	}, [setRevision, setDiffTree, setCompareDiffTree, setStatus, setRevisionsCompare]);

	const reset = useCallback(() => {
		setShow(false);
		setRevision(null);
		setReachedFirstCommit(false);
		setRevisions(null);
		setFilters(null);
		setScrollY(0);
		void onClose();
	}, [setShow, onClose, setRevision, setReachedFirstCommit, setRevisions, setScrollY, setFilters]);

	useEffect(() => {
		const onUpdate: OnBranchUpdateListener = (_, caller) => {
			const callers = [OnBranchUpdateCaller.Checkout, OnBranchUpdateCaller.Publish];
			if (!callers.includes(caller)) return;
			reset();
		};
		BranchUpdaterService.addListener(onUpdate);
		return () => BranchUpdaterService.removeListener(onUpdate);
	}, [reset]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		reset();
	}, [catalogName]);

	useEffect(() => {
		const syncToken = SyncService.events.on("finish", async ({ syncData }) => {
			if (!syncData.isVersionChanged) return;

			setRevisions(null);
			setReachedFirstCommit(false);

			const [beforeRevisions, afterRevisions, freshRevisions] = await Promise.all([
				getRevisions(syncData.before, 1),
				getRevisions(syncData.after, 1),
				getRevisions(),
			]);

			setLatestCommitOid(freshRevisions?.[0]?.oid);
			setRevisions(freshRevisions);

			const fromRevision = beforeRevisions?.[0];
			const toRevision = afterRevisions?.[0];
			if (!fromRevision || !toRevision) return;

			if (navigationBottomTab) return;
			setRevisionsCompare({ from: fromRevision, to: toRevision });
			setStatus("comparing");
			setShow(true);
		});

		const onPublishFinish = async () => {
			const freshRevision = await getRevisions(undefined, 1);
			if (!freshRevision?.[0]) return;
			setLatestCommitOid(freshRevision?.[0]?.oid);
		};

		const publishToken = PublishEmitter.events.on("finish", onPublishFinish);
		return () => {
			SyncService.events.off(syncToken);
			PublishEmitter.events.off(publishToken);
		};
	}, [
		getRevisions,
		setRevisionsCompare,
		setStatus,
		setShow,
		navigationBottomTab,
		setRevisions,
		setReachedFirstCommit,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: needs for opening/closing tab
	useEffect(() => {
		if (show) void onOpen();
		else void onClose();
	}, [show]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: needs for updating diff tree
	useEffect(() => {
		if (!revision || !showDiff) return;
		void requestDiffTree(revision.oid, revision.parents?.[0]);
	}, [revision, showDiff]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: setters and getRevisions are stable
	useEffect(() => {
		if (!show) return;
		setRevisions(null);
		setReachedFirstCommit(false);
		void getRevisions().then((newRevisions) => {
			setRevisions(newRevisions);
		});
	}, [filters]);

	const selectedCommitOid = useMemo(() => {
		const pathnameData = RouterPathProvider.parsePath(router.path);
		const commitOid = getNewCommitOidFromPathname(pathnameData.catalogName);
		return commitOid ?? latestCommitOid;
	}, [latestCommitOid, router.path]);

	return {
		revision,
		revisions,
		diffTree,
		reachedFirstCommit,
		isDiffTreeLoading,
		showDiff,
		requestMore,
		onRevisionClick,
		selectedCommitOid,
	};
};
