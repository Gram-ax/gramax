import Approver from "@ext/git/core/GitMergeRequest/components/Approval/Approver";
import { Section } from "@ext/git/core/GitMergeRequest/components/Elements";
import type { ApprovalSignature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t from "@ext/localization/locale/translate";
import { useReviewerComments } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import { useMemo, useState } from "react";

const Approvers = ({ approvers }: { approvers: ApprovalSignature[] }) => {
	const comments = useReviewerComments({ authors: approvers });
	const [isCollapsed, setIsCollapsed] = useState(false);

	const CachedApprovers = useMemo(() => {
		if (!approvers?.length) return <span>{t("git.merge-requests.no-approvers")}</span>;

		return approvers.map((approver, idx) => (
			<Approver approver={approver} comments={comments[approver.email]?.total} key={idx} />
		));
	}, [approvers, comments]);

	return (
		<Section
			chevron={false}
			isCollapsed={isCollapsed}
			onHeaderClick={() => setIsCollapsed(!isCollapsed)}
			title={t("git.merge-requests.approvers")}
		>
			{CachedApprovers}
		</Section>
	);
};

export default Approvers;
