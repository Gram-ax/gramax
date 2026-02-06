import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import Icon from "@components/Atoms/Icon";
import TabWrapper, { TAB_TRANSITION_TIME } from "@components/Layouts/LeftNavigationTabs/TabWrapper";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import { useApi } from "@core-ui/hooks/useApi";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import Approvers from "@ext/git/core/GitMergeRequest/components/Approval/Approvers";
import { Changes } from "@ext/git/core/GitMergeRequest/components/Changes/Changes";
import { DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import useOpenDeleteMergeRequestModal from "@ext/git/core/GitMergeRequest/components/DeleteMergeRequestModal";
import { Creator, Description, MergeRequestFromWhere, Status } from "@ext/git/core/GitMergeRequest/components/Elements";
import MergeButton from "@ext/git/core/GitMergeRequest/components/MergeButton";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { DropdownMenuItem, DropdownMenuSeparator } from "@ui-kit/Dropdown";
import { useEffect, useMemo, useRef, useState } from "react";
import DiffExtendedModeToggle from "./Changes/DiffExtendedModeToggle";

export type MergeRequestProps = {
	className?: string;
	mergeRequest: MergeRequest;
	isDraft: boolean;
	show: boolean;
	setShow: (show: boolean) => void;
};

const ButtonArea = styled.div`
	display: flex;
	justify-content: space-between;
	flex-direction: row-reverse; // todo: remove
`;

const TopWrapper = styled.div`
	margin-left: 1rem;
	margin-right: 1rem;
	padding-bottom: 0.5rem;
`;

const BottomWrapper = styled.div`
	margin-left: 1rem;
	margin-right: 1rem;
`;

const MergeRequestTab = ({ mergeRequest, isDraft, show, setShow }: MergeRequestProps) => {
	const hasBeenOpened = useRef(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const status = useMemo(() => {
		if (!mergeRequest) return null;
		return isDraft ? "draft" : mergeRequest.approvers.every((a) => a.approvedAt) ? "approved" : "in-progress";
	}, [mergeRequest, isDraft]);

	const [contentHeight, setContentHeight] = useState<number>(null);
	const [stage, setStage] = useState(DiffEntriesLoadStage.NotLoaded);
	const tabWrapperRef = useRef<HTMLDivElement>(null);
	const [isDeleteMergeRequestModalOpen, setIsDeleteMergeRequestModalOpen] = useState(false);

	const restoreRightSidebar = useRestoreRightSidebar();

	const restoreView = async () => {
		const isDefaultView = ArticleViewService.isDefaultView();
		if (isDefaultView) return;

		ArticleViewService.setDefaultView();
		restoreRightSidebar();
		await ArticleUpdaterService.update(apiUrlCreator);
		refreshPage();
	};

	useWatch(() => {
		if (show) hasBeenOpened.current = true;
		if (!show && hasBeenOpened.current) restoreView();
	}, [show]);

	const close = () => {
		setShow(false);
		restoreView();
	};

	const { call: callDeleteMr } = useApi({
		url: (api) => api.deleteMergeRequest(),
		onDone: () => {
			setTimeout(() => {
				BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.MergeRequest);
			}, TAB_TRANSITION_TIME);
		},
	});

	useOpenDeleteMergeRequestModal({
		isOpen: isDeleteMergeRequestModalOpen,
		onClose: () => setIsDeleteMergeRequestModalOpen(false),
		onConfirm: callDeleteMr,
	});

	useEffect(() => {
		const finishToken = SyncService.events.on("finish", () => {
			BranchUpdaterService.updateBranch(apiUrlCreator, OnBranchUpdateCaller.MergeRequest);
		});
		return () => {
			SyncService.events.off(finishToken);
		};
	}, [apiUrlCreator]);

	useEffect(() => {
		if (!tabWrapperRef.current || !show) return;
		const height = calculateTabWrapperHeight(tabWrapperRef.current);
		setContentHeight(height);
	}, [tabWrapperRef.current, show, stage]);

	const cached = useMemo(() => {
		if (!mergeRequest) return null;
		return (
			<>
				<TopWrapper>
					<MergeRequestFromWhere from={mergeRequest.sourceBranchRef} where={mergeRequest.targetBranchRef} />
					<Creator created={mergeRequest.createdAt} from={mergeRequest.creator} />
					<Description content={mergeRequest.description} />
				</TopWrapper>
				<Changes setStage={setStage} stage={stage} targetRef={mergeRequest.targetBranchRef} />
				<BottomWrapper>
					<Approvers approvers={mergeRequest.approvers} />
					<ButtonArea>
						<MergeButton hasConflicts={false} mergeRequest={mergeRequest} status={status} />
					</ButtonArea>
				</BottomWrapper>
			</>
		);
	}, [mergeRequest, status, stage]);

	return mergeRequest ? (
		<TabWrapper
			actions={
				<>
					<DiffExtendedModeToggle />
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => setIsDeleteMergeRequestModalOpen(true)} type="danger">
						<Icon code="trash" />
						{t("delete")}
					</DropdownMenuItem>
				</>
			}
			contentHeight={contentHeight}
			onClose={close}
			ref={tabWrapperRef}
			show={show}
			title={t("git.merge-requests.name")}
			titleRightExtension={<Status status={status} />}
		>
			{cached}
		</TabWrapper>
	) : null;
};

export default MergeRequestTab;
