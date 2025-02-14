import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import TabWrapper from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/TabWrapper";
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
import { useCallback, useEffect } from "react";

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

	const { diffTree, overview, isEntriesLoading, isEntriesReady, resetDiffTree } = usePublishDiffEntries({
		autoUpdate: show,
	});

	const { selectedFiles, isSelectedAll, selectFile, selectAll, isSelected, resetSelection } = usePublishSelection({
		diffTree,
	});

	const { isPublishing, placeholder, message, publish, setMessage } = usePublish({
		diffTree,
		selectedFiles,

		onPublished: () => {
			resetDiffTree();
			resetSelection();
			onClose();
		},
	});

	const reset = useCallback(() => {
		resetDiffTree();
		resetSelection();
		setMessage(null);
	}, [resetDiffTree, resetSelection, setMessage]);

	const apiUrlCreator = ApiUrlCreatorService.value;

	const { discard } = useDiscard(reset);
	const canDiscard = selectedFiles.size > 0 && !isPublishing && !isEntriesLoading && isEntriesReady;
	const restoreRightSidebar = useRestoreRightSidebar();
	const restoreView = () => {
		ArticleViewService.setDefaultView();
		restoreRightSidebar();
	};

	const onClose = () => {
		restoreView();
		setShow(false);
		ArticleUpdaterService.update(apiUrlCreator);
		refreshPage();
	};

	useEffect(() => {
		return restoreView;
	}, []);

	useEffect(() => {
		if (!show) onClose();
	}, [show]);

	useWatch(() => {
		if (show) reset();
	}, [show, reset]);

	const canPublish = !isPublishing && !isEntriesLoading && isEntriesReady && selectedFiles.size > 0;

	useEffect(() => {
		const handler = async (e: KeyboardEvent) =>
			show && e.code === "Enter" && (e.ctrlKey || e.metaKey) && canPublish && (await publish());

		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [show, publish, canPublish]);

	return (
		<TabWrapper show={show} title={t("git.publish.name")} onClose={onClose}>
			<>
				<PublishChanges
					diffTree={diffTree}
					overview={overview}
					isLoading={isEntriesLoading}
					isReady={isEntriesReady}
					canDiscard={canDiscard}
					onDiscard={(paths) => discard(paths?.filter(Boolean) || Array.from(selectedFiles), !paths)}
					selectFile={(file, checked) => {
						if (file.type === "node") return;
						if (isSelectedAll) selectAll(checked);
						selectFile(file.filepath.new, checked, file.filepath.old);
					}}
					selectAll={selectAll}
					isSelectedAll={isSelectedAll}
					isFileSelected={(file) => file.type !== "node" && isSelected(file.filepath.new, file.filepath.old)}
				/>
				<CommitMessage
					commitMessageValue={message}
					commitMessagePlaceholder={placeholder}
					disableCommitInput={isPublishing || !isEntriesReady}
					disablePublishButton={!canPublish}
					fileCount={selectedFiles.size}
					onPublishClick={() => void publish()}
					onCommitMessageChange={(msg) => setMessage(msg)}
					isLoading={isPublishing}
				/>
			</>
		</TabWrapper>
	);
};

export default PublishTab;
