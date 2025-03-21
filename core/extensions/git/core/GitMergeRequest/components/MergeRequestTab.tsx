import TabWrapper from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/TabWrapper";
import calculateTabWrapperHeight from "@components/Layouts/StatusBar/Extensions/logic/calculateTabWrapperHeight";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import OnBranchUpdateCaller from "@ext/git/actions/Branch/BranchUpdaterService/model/OnBranchUpdateCaller";
import SyncService from "@ext/git/actions/Sync/logic/SyncService";
import Approvers from "@ext/git/core/GitMergeRequest/components/Approval/Approvers";
import { Changes } from "@ext/git/core/GitMergeRequest/components/Changes/Changes";
import { DiffEntriesLoadStage } from "@ext/git/core/GitMergeRequest/components/Changes/DiffEntries";
import { Creator, Description, FromWhere, Status } from "@ext/git/core/GitMergeRequest/components/Elements";
import MergeButton from "@ext/git/core/GitMergeRequest/components/MergeButton";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useEffect, useMemo, useRef, useState } from "react";

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

	const restoreRightSidebar = useRestoreRightSidebar();

	const restoreView = () => {
		ArticleViewService.setDefaultView();
		restoreRightSidebar();
	};

	useWatch(() => {
		if (show) hasBeenOpened.current = true;
		if (!show && hasBeenOpened.current) restoreView();
	}, [show]);

	const close = () => {
		setShow(false);
		restoreView();
	};

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
					<FromWhere from={mergeRequest.sourceBranchRef} where={mergeRequest.targetBranchRef} />
					<Creator from={mergeRequest.creator} created={mergeRequest.createdAt} />
					<Description content={mergeRequest.description} />
				</TopWrapper>
				<Changes
					targetRef={mergeRequest.targetBranchRef}
					sourceRef={mergeRequest.sourceBranchRef}
					stage={stage}
					setStage={setStage}
				/>
				<BottomWrapper>
					<Approvers approvers={mergeRequest.approvers} />
					<ButtonArea>
						<MergeButton status={status} mergeRequest={mergeRequest} hasConflicts={false} />
					</ButtonArea>
				</BottomWrapper>
			</>
		);
	}, [mergeRequest, status, stage]);

	return mergeRequest ? (
		<TabWrapper
			ref={tabWrapperRef}
			show={show}
			title={t("git.merge-requests.name")}
			titleRightExtension={<Status status={status} />}
			onClose={close}
			contentHeight={contentHeight}
		>
			{cached}
		</TabWrapper>
	) : null;
};

export default MergeRequestTab;
