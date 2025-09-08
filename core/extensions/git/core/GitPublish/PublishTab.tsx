import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import TabWrapper from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import CommitMsg from "@ext/git/actions/Publish/components/CommitMsg";
import { PublishChanges } from "@ext/git/core/GitPublish/PublishChanges";
import { useDiscard } from "@ext/git/core/GitPublish/useDiscard";
import usePublish from "@ext/git/core/GitPublish/usePublish";
import usePublishDiffEntries from "@ext/git/core/GitPublish/usePublishDiffEntries";
import usePublishSelection from "@ext/git/core/GitPublish/usePublishSelectedFiles";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect, useRef, useState } from "react";

export type PublishTabProps = {
	show: boolean;
	setShow: (show: boolean) => void;
};

const CommitMessage = styled(CommitMsg)`
	padding-top: 0.7rem;
	padding-left: 1rem;
	padding-right: 1rem;
`;

const PublishTab = ({ show, setShow }: PublishTabProps) => {
	const { isNext } = usePlatform();
	if (isNext) return null;

	const [contentHeight, setContentHeight] = useState<number>(null);
	const [isDiscarding, setIsDiscarding] = useState(false);

	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const hasBeenOpened = useRef(false);
	const hasDiscarded = useRef(false);

	const { diffTree, overview, isEntriesLoading, isEntriesReady } = usePublishDiffEntries({
		autoUpdate: show,
	});

	const { selectedFiles, isSelectedAll, selectFile, selectAll, isSelected, resetSelection } = usePublishSelection({
		diffTree,
	});

	const { isPublishing, placeholder, message, publish, setMessage } = usePublish({
		diffTree,
		selectedFiles,

		onPublished: () => {
			resetSelection();
			void close();
		},
	});

	const apiUrlCreator = ApiUrlCreatorService.value;

	const onDiscard = useCallback(() => {
		hasDiscarded.current = true;
	}, []);

	const { discard } = useDiscard(onDiscard);
	const canDiscard = selectedFiles.size > 0 && !isPublishing && !isEntriesLoading && isEntriesReady;
	const restoreRightSidebar = useRestoreRightSidebar();

	const restoreView = () => {
		ArticleViewService.setDefaultView();
		restoreRightSidebar();
	};

	const close = async () => {
		setShow(false);
		const isDefaultView = ArticleViewService.isDefaultView();
		restoreView();
		if (hasDiscarded.current || !isDefaultView) {
			await ArticleUpdaterService.update(apiUrlCreator);
			refreshPage();
		}
		hasDiscarded.current = false;
	};

	const open = () => {
		setShow(true);
		hasBeenOpened.current = true;
	};

	const closeIfDiscardedAll = () => {
		if (diffTree?.tree.length === 0 && hasDiscarded.current) void close();
	};

	useWatch(closeIfDiscardedAll, [diffTree, hasDiscarded]);

	useEffect(() => {
		return restoreView;
	}, []);

	useWatch(() => {
		if (show) open();
		if (!show && hasBeenOpened.current) void close();
	}, [show]);

	const canPublish = !isPublishing && !isEntriesLoading && isEntriesReady && selectedFiles.size > 0;

	const hasChanges = diffTree?.tree?.length > 0;

	const isDiffEntriesLoading = !diffTree?.tree && isEntriesLoading;
	const isLoading = !isDiffEntriesLoading && (isDiscarding || isEntriesLoading);

	return (
		<TabWrapper
			data-qa="qa-publish-tab"
			ref={tabWrapperRef}
			contentHeight={contentHeight}
			show={show}
			title={t("git.publish.name")}
			onClose={close}
			titleRightExtension={isLoading ? <SpinnerLoader width={12} height={12} lineWidth={1.5} /> : null}
		>
			<>
				<PublishChanges
					show={show}
					tabWrapperRef={tabWrapperRef}
					diffTree={diffTree}
					overview={overview}
					isLoading={isDiffEntriesLoading}
					isReady={isEntriesReady}
					setContentHeight={setContentHeight}
					canDiscard={canDiscard}
					onDiscard={async (paths) => {
						setIsDiscarding(true);
						await discard(paths?.filter(Boolean) || Array.from(selectedFiles), !paths);
						setIsDiscarding(false);
					}}
					selectFile={(file, checked) => {
						if (file.type === "node") return;
						if (isSelectedAll) selectAll(checked);
						selectFile(file.filepath.new, checked, file.filepath.old);
					}}
					selectAll={selectAll}
					isSelectedAll={isSelectedAll}
					isFileSelected={(file) => file.type !== "node" && isSelected(file.filepath.new, file.filepath.old)}
				/>
				{hasChanges && (
					<CommitMessage
						commitMessageValue={message}
						commitMessagePlaceholder={placeholder}
						disableCommitInput={isPublishing || !isEntriesReady || isDiscarding}
						disablePublishButton={!canPublish || isDiscarding}
						fileCount={selectedFiles.size}
						onPublishClick={() => void publish()}
						onCommitMessageChange={(msg) => setMessage(msg)}
						isLoading={isPublishing}
					/>
				)}
			</>
		</TabWrapper>
	);
};

export default PublishTab;
