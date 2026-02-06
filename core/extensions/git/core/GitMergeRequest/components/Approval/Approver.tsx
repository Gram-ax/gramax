import { css } from "@emotion/react";
import styled from "@emotion/styled";
import ApproveCheckbox from "@ext/git/core/GitMergeRequest/components/Approval/ApproveCheckbox";
import { useApproval } from "@ext/git/core/GitMergeRequest/components/Approval/useApproval";
import { Author } from "@ext/git/core/GitMergeRequest/components/Elements";
import type { ApprovalSignature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";

const Wrapper = styled.div<{ you?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 -1.4em;
	padding: 0.2em 1.3em;

	${(props) =>
		props.you &&
		css`
			cursor: pointer;
			:hover {
				background-color: var(--color-merge-request-hover);
			}
		`};
`;

const Part = styled.span`
	display: flex;
	gap: 1rem;
`;

const Approver = ({ approver, comments }: { approver: ApprovalSignature; comments: number }) => {
	const { setApprove, canSetApprove } = useApproval({ approver });

	return (
		<Wrapper onClick={canSetApprove ? () => setApprove(!approver.approvedAt) : null} you={canSetApprove}>
			<Part>
				<Author author={approver} comments={comments} you={canSetApprove} />
			</Part>
			<Part>
				<ApproveCheckbox since={approver.approvedAt} status={approver.approvedAt ? "approved" : "unapproved"} />
			</Part>
		</Wrapper>
	);
};

export default Approver;
