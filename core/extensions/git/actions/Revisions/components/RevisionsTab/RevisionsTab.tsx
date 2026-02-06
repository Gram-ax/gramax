import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useSetArticleDiffView from "@core-ui/hooks/diff/useSetArticleDiffView";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import BranchUpdaterService, {
	type OnBranchUpdateListener,
} from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import RevisionsWhomWhere from "@ext/git/actions/Revisions/components/RevisionsTab/RevisionsWhomWhere";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import type { DiffTree } from "@ext/git/core/GitDiffItemCreator/RevisionDiffTreePresenter";
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
	const { isNext } = usePlatform();
	if (isNext) return null;

	const { show, setShow } = props;

	const tabWrapperRef = useRef<HTMLDivElement>(null);
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
				apiUrlCreator.getVersionControlDiffTreeUrl({ commit: revision }),
			);
			setIsDiffTreeLoading(false);
			if (!res.ok) return;
			const data = await res.json();
			setDiffTree(data);
		},
		[apiUrlCreator],
	);

	const getRevisions = async (from?: string) => {
		const depth = 51;
		const res = await FetchService.fetch<GitVersionDataSet>(
			apiUrlCreator.getVersionControlRevisionsUrl(from, depth),
		);
		if (!res.ok) return [];
		const data = await res.json();
		setReachedFirstCommit(data.reachedFirstCommit);
		return data.data.slice(1);
	};

	const requestMore = async (lastRevision: string) => {
		const newRevisions = await getRevisions(lastRevision);
		setRevisions([...revisions, ...newRevisions]);
	};

	const onNewRevisionClick = useCallback(
		(revision: string) => {
			if (!revision) return;
			setRevision(revision);
			void requestDiffTree(revision);
		},
		[requestDiffTree],
	);

	const onOpen = async () => {
		const revisions = await getRevisions();

		const onFirstOpen = () => {
			if (!revisions?.[0]) return;
			const firstParentOid = revisions[0].oid;
			setRevision(firstParentOid);
			void requestDiffTree(firstParentOid);
		};

		if (!revision) onFirstOpen();

		setRevisions(revisions);
	};

	const onClose = async () => {
		setRevisions(null);

		const isDefaultView = ArticleViewService.isDefaultView();
		if (isDefaultView) return;

		ArticleViewService.setDefaultView();
		restoreRightSidebar();
		await ArticleUpdaterService.update(apiUrlCreator);
		refreshPage();
	};

	const reset = () => {
		setShow(false);
		setRevision(null);
		setDiffTree(null);
		setIsDiffTreeLoading(false);
		setReachedFirstCommit(false);
		setRevisions(null);
	};

	useEffect(() => {
		const onUpdate: OnBranchUpdateListener = (_, caller) => {
			const callers = [OnBranchUpdateCaller.Checkout, OnBranchUpdateCaller.Publish];
			if (!callers.includes(caller)) return;
			reset();
		};
		BranchUpdaterService.addListener(onUpdate);
		return () => BranchUpdaterService.removeListener(onUpdate);
	}, []);

	useEffect(() => {
		if (show) void onOpen();
		else void onClose();
	}, [show]);

	useEffect(() => {
		if (!tabWrapperRef.current || !show) return;
		const height = calculateTabWrapperHeight(tabWrapperRef.current);
		setContentHeight(height);
	}, [tabWrapperRef.current, show, diffTree, revision]);

	useEffect(() => {
		if (!revision || !show) return;
		void requestDiffTree(revision);
	}, [gitStatus, show]);

	const tryOpenBeforeSyncRevision = useCallback(() => {
		const token = SyncService.events.on("finish", ({ syncData }) => {
			if (!syncData.isVersionChanged) return;
			setShow(true);
			setRevision(syncData.before);
			void requestDiffTree(syncData.before);
		});

		return () => SyncService.events.off(token);
	}, []);

	useEffect(tryOpenBeforeSyncRevision, [tryOpenBeforeSyncRevision]);

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
						isLoading={!diffTree?.tree || isDiffTreeLoading}
						right={diffTree?.tree && <Overview fontSize="12px" showTotal {...diffTree.overview} />}
						title={t("git.merge-requests.diff")}
					>
						<ScrollableDiffEntriesLayout>
							{diffTree?.tree && (
								<DiffEntries
									changes={diffTree?.tree}
									renderCommentsCount
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
