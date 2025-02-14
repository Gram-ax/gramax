import TabWrapper from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/TabWrapper";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useRestoreRightSidebar from "@core-ui/hooks/diff/useRestoreRightSidebar";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import Approvers from "@ext/git/core/GitMergeRequest/components/Approval/Approvers";
import { Changes } from "@ext/git/core/GitMergeRequest/components/Changes/Changes";
import { Creator, Description, FromWhere, Status } from "@ext/git/core/GitMergeRequest/components/Elements";
import MergeButton from "@ext/git/core/GitMergeRequest/components/MergeButton";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useMemo } from "react";

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
	const status = useMemo(() => {
		if (!mergeRequest) return null;
		return isDraft ? "draft" : mergeRequest.approvers.every((a) => a.approvedAt) ? "approved" : "in-progress";
	}, [mergeRequest, isDraft]);

	const restoreRightSidebar = useRestoreRightSidebar();

	const restoreView = () => {
		ArticleViewService.setDefaultView();
		restoreRightSidebar();
	};

	useWatch(() => {
		if (!show) restoreView();
	}, [show]);

	const close = () => {
		setShow(false);
		restoreView();
	};

	const cached = useMemo(() => {
		if (!mergeRequest) return null;
		return (
			<>
				<TopWrapper>
					<FromWhere from={mergeRequest.sourceBranchRef} where={mergeRequest.targetBranchRef} />
					<Creator from={mergeRequest.creator} created={mergeRequest.createdAt} />
					<Description content={mergeRequest.description} />
				</TopWrapper>
				<Changes targetRef={mergeRequest.targetBranchRef} sourceRef={mergeRequest.sourceBranchRef} />
				<BottomWrapper>
					<Approvers approvers={mergeRequest.approvers} />
					<ButtonArea>
						<MergeButton status={status} mergeRequest={mergeRequest} hasConflicts={false} />
					</ButtonArea>
				</BottomWrapper>
			</>
		);
	}, [mergeRequest, status]);

	return mergeRequest ? (
		<TabWrapper
			show={show}
			title={t("git.merge-requests.name")}
			titleRightExtension={<Status status={status} />}
			onClose={close}
		>
			{cached}
		</TabWrapper>
	) : null;
};

export default MergeRequestTab;
