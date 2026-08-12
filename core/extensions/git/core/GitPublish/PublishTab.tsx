/** biome-ignore-all lint/style/noRestrictedImports: it's ok */
import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import styled from "@emotion/styled";
import CommitMsg from "@ext/git/actions/Publish/components/CommitMsg";
import { useDiffExtendedMode } from "@ext/git/core/Diff/components/store/DiffExtendedModeStore";
import { countSelectedVisibleEntries } from "@ext/git/core/Diff/logic/utils/visibleDiffEntries";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { PublishChanges } from "@ext/git/core/GitPublish/PublishChanges";
import { PublishHealthcheckCode, type PublishHealthcheckResult } from "@ext/git/core/GitPublish/PublishHealthcheck";
import { useDiscard } from "@ext/git/core/GitPublish/useDiscard";
import usePublish from "@ext/git/core/GitPublish/usePublish";
import usePublishDiffEntries from "@ext/git/core/GitPublish/usePublishDiffEntries";
import usePublishSelection from "@ext/git/core/GitPublish/usePublishSelectedFiles";
import t from "@ext/localization/locale/translate";
import { Loader } from "@ui-kit/Loader";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DiffExtendedModeToggle from "../Diff/components/Changes/DiffExtendedModeToggle";
import { useDiffToggle } from "../Diff/logic/hooks/useDiffToggle";

export type PublishTabProps = {
	show: boolean;
	setShow: (show: boolean) => void;
};

const CommitMessage = styled(CommitMsg)`
	padding-top: 0.7rem;
	padding-left: 1rem;
	padding-right: 1rem;
`;

const PublishTab = memo(({ show = false, setShow }: PublishTabProps) => {
	const [contentHeight, setContentHeight] = useState<number>(null);
	const [isDiscarding, setIsDiscarding] = useState(false);

	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const hasBeenOpened = useRef(false);
	const hasDiscarded = useRef(false);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const {
		call: checkPublishHealth,
		data: publishHealth,
		status: publishHealthStatus,
		reset: resetPublishHealth,
	} = useApi<PublishHealthcheckResult>({
		url: (api) => api.getStoragePublishHealthcheckUrl(),
	});

	const { diffTree, overview, isEntriesLoading, isEntriesReady } = usePublishDiffEntries({
		autoUpdate: show,
	});

	const { selectedFiles, isSelectedAll, selectFile, selectAll, isSelected, resetSelection } = usePublishSelection({
		diffTree,
	});

	const diffToggle = useDiffToggle();
	const extendedMode = useDiffExtendedMode();

	const clearAllPositions = useScrollPositionStore((s) => s.clearAll);

	const restoreView = useCallback(() => {
		ArticleViewService.setDefaultView();
	}, []);

	const close = useCallback(
		async (callSetShow = true) => {
			if (callSetShow) setShow(false);
			const isDefaultView = ArticleViewService.isDefaultView();
			restoreView();
			if (hasDiscarded.current || !isDefaultView) {
				await ArticleUpdaterService.update(apiUrlCreator);
				refreshPage();
			}
			hasDiscarded.current = false;
		},
		[setShow, restoreView],
	);

	const onPublished = useCallback(() => {
		resetSelection();
		void close();
		clearAllPositions();
	}, [resetSelection, close, clearAllPositions]);

	const { isPublishing, placeholder, message, publish, setMessage } = usePublish({
		diffTree,
		selectedFiles,
		onPublished,
	});

	const onDiscard = useCallback(() => {
		hasDiscarded.current = true;
	}, []);

	const { discard } = useDiscard(selectedFiles, onDiscard);
	const canDiscard = selectedFiles.size > 0 && !isPublishing && !isEntriesLoading && isEntriesReady;

	const open = useCallback(() => {
		setShow(true);
		hasBeenOpened.current = true;
		diffToggle();
	}, [setShow, diffToggle]);

	const closeIfDiscardedAll = useCallback(() => {
		if (diffTree?.data.length === 0 && hasDiscarded.current) void close();
	}, [diffTree, close]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(closeIfDiscardedAll, [diffTree, hasDiscarded]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		return restoreView;
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (show) open();
		if (!show && hasBeenOpened.current && !hasDiscarded.current) void close(false);
	}, [show]);

	useEffect(() => {
		if (!show) return;
		resetPublishHealth();
		void checkPublishHealth();
	}, [show, checkPublishHealth, resetPublishHealth]);

	const onEntryDiscard = useCallback(
		async (paths?: string[]) => {
			setIsDiscarding(true);
			await discard(paths?.filter(Boolean) || Array.from(selectedFiles), !paths);
			setIsDiscarding(false);
		},
		[discard, selectedFiles],
	);

	const changesSelectFile = useCallback(
		(file: DiffFlattenTreeAnyItem, checked: boolean) => {
			if (file.type === "node") return;
			if (isSelectedAll) selectAll(checked);
			selectFile(file.filepath.new, checked, file.filepath.old);
		},
		[selectFile, isSelectedAll, selectAll],
	);

	const isFileSelected = useCallback(
		(file: DiffFlattenTreeAnyItem) => {
			if (file.type === "node") return false;
			return isSelected(file.filepath.new, file.filepath.old);
		},
		[isSelected],
	);

	// счётчик показывает столько же, сколько выбранных строк видно в списке: в упрощённом режиме
	// ресурсы статьи спрятаны в её строке, в расширенном — показаны отдельно
	const fileCount = useMemo(
		() => countSelectedVisibleEntries(diffTree?.data, extendedMode, isFileSelected),
		[diffTree, extendedMode, isFileSelected],
	);

	const healthcheckPending =
		publishHealthStatus === RequestStatus.Init || publishHealthStatus === RequestStatus.Loading;
	const healthcheckLoading = publishHealthStatus === RequestStatus.Loading;
	const isProtectedBranch = !healthcheckPending && publishHealth?.code === PublishHealthcheckCode.ProtectedBranch;
	const isHasGitConflicts = !healthcheckPending && publishHealth?.code === PublishHealthcheckCode.HasGitConflicts;
	const selectedFilesReady = selectedFiles.size > 0 && isEntriesReady && !isEntriesLoading;
	const commitInputDisabled =
		isProtectedBranch || healthcheckPending || isDiscarding || isPublishing || !isEntriesReady || isHasGitConflicts;
	const publishButtonDisabled = healthcheckPending || isDiscarding || isPublishing || !selectedFilesReady;
	const hasChanges = diffTree?.data?.length > 0;
	const isDiffEntriesLoading = !diffTree?.data && isEntriesLoading;
	const isLoading = !isDiffEntriesLoading && (isDiscarding || isEntriesLoading || healthcheckLoading);

	return (
		<TabWrapper
			actions={<DiffExtendedModeToggle />}
			contentHeight={contentHeight}
			dataQa="qa-publish-tab"
			onClose={close}
			ref={tabWrapperRef}
			show={show}
			title={t("git.publish.name")}
			titleRightExtension={isLoading ? <Loader className="p-0" data-qa="loader" size="sm" /> : null}
		>
			<>
				<PublishChanges
					canDiscard={canDiscard}
					diffTree={diffTree}
					isFileSelected={isFileSelected}
					isLoading={isDiffEntriesLoading}
					isReady={isEntriesReady}
					isSelectedAll={isSelectedAll}
					onDiscard={onEntryDiscard}
					overview={overview}
					selectAll={selectAll}
					selectFile={changesSelectFile}
					setContentHeight={setContentHeight}
					show={show}
					tabWrapperRef={tabWrapperRef}
				/>
				{hasChanges && (
					<CommitMessage
						commitMessagePlaceholder={placeholder}
						commitMessageValue={message}
						disableCommitInput={commitInputDisabled}
						disablePublishButton={publishButtonDisabled}
						fileCount={fileCount}
						isLoading={isPublishing}
						onCommitMessageChange={(msg) => setMessage(msg)}
						onPublishClick={() => void publish()}
						showCreateBranchButton={isProtectedBranch}
						showGitConflictsButton={isHasGitConflicts}
					/>
				)}
			</>
		</TabWrapper>
	);
});

export default PublishTab;
