import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import styled from "@emotion/styled";
import CommitMsg from "@ext/git/actions/Publish/components/CommitMsg";
import type { DiffFlattenTreeAnyItem } from "@ext/git/core/GitDiffItemCreator/RevisionDiffPresenter";
import { PublishChanges } from "@ext/git/core/GitPublish/PublishChanges";
import { useDiscard } from "@ext/git/core/GitPublish/useDiscard";
import usePublish from "@ext/git/core/GitPublish/usePublish";
import usePublishDiffEntries from "@ext/git/core/GitPublish/usePublishDiffEntries";
import usePublishSelection from "@ext/git/core/GitPublish/usePublishSelectedFiles";
import t from "@ext/localization/locale/translate";
import { Loader } from "@ui-kit/Loader";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import DiffExtendedModeToggle from "../GitMergeRequest/components/Changes/DiffExtendedModeToggle";

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

	const { diffTree, overview, isEntriesLoading, isEntriesReady } = usePublishDiffEntries({
		autoUpdate: show,
	});

	const { selectedFiles, isSelectedAll, selectFile, selectAll, isSelected, resetSelection } = usePublishSelection({
		diffTree,
	});

	const clearAllPositions = useScrollPositionStore((s) => s.clearAll);

	const restoreRightSidebar = useRestoreRightSidebar();

	const restoreView = useCallback(() => {
		ArticleViewService.setDefaultView();
		restoreRightSidebar();
	}, [restoreRightSidebar]);

	const close = useCallback(async () => {
		setShow(false);
		const isDefaultView = ArticleViewService.isDefaultView();
		restoreView();
		if (hasDiscarded.current || !isDefaultView) {
			await ArticleUpdaterService.update(apiUrlCreator);
			refreshPage();
		}
		hasDiscarded.current = false;
	}, [setShow, restoreView, apiUrlCreator]);

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
	}, [setShow]);

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
		if (!show && hasBeenOpened.current && !hasDiscarded.current) void close();
	}, [show]);

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

	const canPublish = !isPublishing && !isEntriesLoading && isEntriesReady && selectedFiles.size > 0;

	const hasChanges = diffTree?.data?.length > 0;

	const isDiffEntriesLoading = !diffTree?.data && isEntriesLoading;
	const isLoading = !isDiffEntriesLoading && (isDiscarding || isEntriesLoading);

	return (
		<TabWrapper
			actions={<DiffExtendedModeToggle />}
			contentHeight={contentHeight}
			dataQa="qa-publish-tab"
			onClose={close}
			ref={tabWrapperRef}
			show={show}
			title={t("git.publish.name")}
			titleRightExtension={isLoading ? <Loader className="p-0" size="sm" /> : null}
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
						disableCommitInput={isPublishing || !isEntriesReady || isDiscarding}
						disablePublishButton={!canPublish || isDiscarding}
						fileCount={selectedFiles.size}
						isLoading={isPublishing}
						onCommitMessageChange={(msg) => setMessage(msg)}
						onPublishClick={() => void publish()}
					/>
				)}
			</>
		</TabWrapper>
	);
});

export default PublishTab;
