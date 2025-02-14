import styled from "@emotion/styled";
import { Accent } from "@ext/git/core/GitMergeRequest/components/Elements";
import type { ApprovalSignature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";

const TotalApprovals = ({ approvers }: { approvers: ApprovalSignature[] }) => {
	if (!approvers?.length) return null;

	const Wrapper = styled.span`
		display: flex;
		align-items: center;
		gap: 0.3rem;
	`;

	return (
		<Wrapper>
			<Accent>{approvers.filter((approver) => approver.approvedAt).length}</Accent> {t("git.merge-requests.of")}{" "}
			<Accent>{approvers.length}</Accent>
		</Wrapper>
	);
};

export default TotalApprovals;
