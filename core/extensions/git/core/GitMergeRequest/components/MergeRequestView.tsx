import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import Assignees, { FromWhere } from "@ext/git/core/GitMergeRequest/components/Assignees";
import DiffButton from "@ext/git/core/GitMergeRequest/components/DiffButton";
import MergeButton from "@ext/git/core/GitMergeRequest/components/MergeButton";
import Status from "@ext/git/core/GitMergeRequest/components/Status";
import type { MergeRequest } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";

export type MergeRequestProps = {
	className?: string;
	mergeRequest: MergeRequest;
	isDraft: boolean;
	show: boolean;
	setShow: (show: boolean) => void;
};

const Wrapper = styled.div`
	width: 100%;
	padding: 0.7rem 0.6rem 0.7rem 0.6rem;
	background-color: white;
	border-width: 1px 1px 0px 1px;
	border-style: solid;
	border-color: #00000021;
	font-size: 12px;
`;

const Title = styled.span`
	text-transform: uppercase;
	font-weight: 500;
	white-space: nowrap;
	font-size: 14px;
`;

const Header = styled.span`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 7px;
`;

const HeaderPart = styled.span`
	display: flex;
	align-items: center;
	flex-wrap: nowrap;
	gap: 0.3rem;
	max-width: 85%;
	overflow-y: hidden;
	overflow-x: auto;
	scrollbar-width: none;
	-ms-overflow-style: none;
	::-webkit-scrollbar {
		display: none;
	}
`;

const ControlIcon = styled(Icon)`
	font-size: 1.4rem;
	cursor: pointer;
`;

const Controls = styled.div`
	display: flex;
	justify-content: space-between;
`;

const MergeRequestView = ({ mergeRequest, isDraft, show, setShow }: MergeRequestProps) => {
	if (!show || !mergeRequest) return;

	const status = isDraft ? "draft" : mergeRequest.assignees.every((a) => a.approvedAt) ? "approved" : "in-progress";

	return (
		<Wrapper>
			<Header>
				<HeaderPart>
					<Title>{t("git.merge-requests.name")}</Title>
					<Status status={status} />
				</HeaderPart>
				<HeaderPart>
					<ControlIcon
						strokeWidth={1.2}
						tooltipContent={t("close")}
						code="x"
						onClick={() => setShow(false)}
					/>
				</HeaderPart>
			</Header>
			<FromWhere
				from={mergeRequest.author}
				where={mergeRequest.targetBranchRef}
				created={mergeRequest.createdAt}
			/>
			<Assignees assignees={mergeRequest.assignees} />
			<Controls>
				<DiffButton sourceBranch={mergeRequest.sourceBranchRef} targetBranch={mergeRequest.targetBranchRef} />
				<MergeButton status={status} mergeRequest={mergeRequest} />
			</Controls>
		</Wrapper>
	);
};

export default MergeRequestView;
