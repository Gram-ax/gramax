import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import styled from "@emotion/styled";
import BranchUpdaterService, {
	type OnBranchUpdateListener,
} from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import RevisionsWhomWhere from "@ext/git/actions/Revisions/components/RevisionsTab/RevisionsWhomWhere";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { DiffEntries } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import DiffExtendedModeToggle from "@ext/git/core/GitMergeRequest/components/Changes/DiffExtendedModeToggle";
import { Overview } from "@ext/git/core/GitMergeRequest/components/Changes/Overview";
import ScrollableDiffEntriesLayout from "@ext/git/core/GitMergeRequest/components/Changes/ScrollableDiffEntriesLayout";
import { Section } from "@ext/git/core/GitMergeRequest/components/Elements";
import type { GitVersionDataSet } from "@ext/git/core/GitVersionControl/GitVersionControl";
import type GitVersionData from "@ext/git/core/model/GitVersionData";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface RevisionsTabProps {
	show: boolean;
	setShow: (show: boolean) => void;
}

const TopWrapper = styled.div`
	margin-left: 1rem;
	margin-right: 1rem;
	padding-bottom: 0.5rem;
`;

const RevisionsTab = (props: RevisionsTabProps) => {
	const { show, setShow } = props;

	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const scrollableRef = useRef<HTMLDivElement>(null);
	const wasOpenedRef = useRef(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState<number>(null);

	const [isDiffTreeLoading, setIsDiffTreeLoading] = useState(false);
	const [diffTree, setDiffTree] = useState<DiffTree>(null);
	const [revision, setRevision] = useState<string>(null);
	const [revisions, setRevisions] = useState<GitVersionData[]>(null);
	const [reachedFirstCommit, setReachedFirstCommit] = useState<boolean>(false);

	const deleteScope = useMemo(() => ({ commit: revision }), [revision]);
	const setArticleDiffView = useSetArticleDiffView(false, null, deleteScope);
	const gitStatus = GitIndexService.getStatus();
	const restoreRightSidebar = useRestoreRightSidebar();

	const apiUrlCreator = ApiUrlCreator.value;

	const requestDiffTree = useCallback(
		async (revision: string) => {
			setIsDiffTreeLoading(true);
			const res = await FetchService.fetch<DiffTree>(
				apiUrlCreator.getVersionControlDiffTreeUrl({ commit: revision }, "HEAD"),
			);
			setIsDiffTreeLoading(false);
			if (!res.ok) return;
			const data = await res.json();
			setDiffTree(data);
		},
		[apiUrlCreator],
	);

	const getRevisions = useCallback(
		async (from?: string) => {
			const depth = 51;
			const res = await FetchService.fetch<GitVersionDataSet>(
				apiUrlCreator.getVersionControlRevisionsUrl(from, depth),
			);
			if (!res.ok) return [];
			const data = await res.json();
			setReachedFirstCommit(data.reachedFirstCommit);
			return data.data.slice(1);
		},
		[apiUrlCreator],
	);

	const requestMore = useCallback(
		async (lastRevision: string) => {
			const newRevisions = await getRevisions(lastRevision);
			setRevisions([...revisions, ...newRevisions]);
		},
		[getRevisions, revisions],
	);

	const onNewRevisionClick = useCallback(
		(revision: string) => {
			if (!revision) return;
			setRevision(revision);
			void requestDiffTree(revision);
		},
		[requestDiffTree],
	);

	const onOpen = useCallback(async () => {
		const revisions = await getRevisions();

		const onFirstOpen = () => {
			if (!revisions?.[0]) return;
			const firstParentOid = revisions[0].oid;
			setRevision(firstParentOid);
			void requestDiffTree(firstParentOid);
		};

		if (!revision) onFirstOpen();

		setRevisions(revisions);
	}, [getRevisions, requestDiffTree, revision]);

	const onClose = useCallback(async () => {
		setRevisions(null);

		const isDefaultView = ArticleViewService.isDefaultView();
		if (isDefaultView) return;

		ArticleViewService.setDefaultView();
		restoreRightSidebar();
		await ArticleUpdaterService.update(apiUrlCreator);
		refreshPage();
	}, [apiUrlCreator, restoreRightSidebar]);

	const reset = useCallback(() => {
		setShow(false);
		wasOpenedRef.current = false;
		setRevision(null);
		setDiffTree(null);
		setIsDiffTreeLoading(false);
		setReachedFirstCommit(false);
		setRevisions(null);
	}, [setShow]);

	useEffect(() => {
		const onUpdate: OnBranchUpdateListener = (_, caller) => {
			const callers = [OnBranchUpdateCaller.Checkout, OnBranchUpdateCaller.Publish];
			if (!callers.includes(caller)) return;
			reset();
		};
		BranchUpdaterService.addListener(onUpdate);
		return () => BranchUpdaterService.removeListener(onUpdate);
	}, [reset]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: needs for opening/closing tab
	useEffect(() => {
		if (show) {
			wasOpenedRef.current = true;
			void onOpen();
		} else if (wasOpenedRef.current) void onClose();
	}, [show]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: needs for calculating height
	useEffect(() => {
		if (!tabWrapperRef.current || !show) return;
		const height = calculateTabWrapperHeight(tabWrapperRef.current);
		setContentHeight(height);
	}, [containerRef.current, tabWrapperRef.current, show, diffTree, revision]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: needs for updating diff tree
	useEffect(() => {
		if (!revision || !show) return;
		void requestDiffTree(revision);
	}, [gitStatus, show, requestDiffTree, revision]);

	const tryOpenBeforeSyncRevision = useCallback(() => {
		const token = SyncService.events.on("finish", ({ syncData }) => {
			if (!syncData.isVersionChanged) return;
			setShow(true);
			setRevision(syncData.before);
			void requestDiffTree(syncData.before);
		});

		return () => SyncService.events.off(token);
	}, [requestDiffTree, setShow]);

	useEffect(tryOpenBeforeSyncRevision, []);

	return (
		<TabWrapper
			actions={<DiffExtendedModeToggle />}
			contentHeight={contentHeight}
			onClose={() => setShow(false)}
			ref={tabWrapperRef}
			show={show}
			title={t("git.revisions.compare-title")}
		>
			<div>
				<TopWrapper>
					<RevisionsWhomWhere
						currentRevision={revision}
						onClick={onNewRevisionClick}
						requestMore={requestMore}
						revisions={revisions}
						shouldLoadMoreAtScrollEnd={!reachedFirstCommit}
					/>
				</TopWrapper>
				{revision && (
					<Section
						chevron={false}
						headerStyles="padding-left: 1rem; padding-right: 1rem;"
						isCollapsed={false}
						isLoading={!diffTree?.data || isDiffTreeLoading}
						right={diffTree?.data && <Overview fontSize="12px" showTotal {...diffTree.overview} />}
						title={t("git.merge-requests.diff")}
					>
						<ScrollableDiffEntriesLayout ref={scrollableRef}>
							{diffTree?.data && (
								<DiffEntries
									changes={diffTree?.data}
									ref={containerRef}
									renderCommentsCount
									scrollableRef={scrollableRef}
									setArticleDiffView={setArticleDiffView}
								/>
							)}
						</ScrollableDiffEntriesLayout>
					</Section>
				)}
			</div>
		</TabWrapper>
	);
};

export default RevisionsTab;
