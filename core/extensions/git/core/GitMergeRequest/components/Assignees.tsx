import Date from "@components/Atoms/Date";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import UserCircle from "@components/Atoms/UserCircle";
import VersionControlCommentCount from "@components/Comments/CommentCount";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import BlueBranch from "@ext/git/actions/Branch/components/BlueBranch";
import { useApproval } from "@ext/git/core/GitMergeRequest/components/useApproval";
import useReviewerComments from "@ext/git/core/GitMergeRequest/components/useReviewerComments";
import type { ApprovalSignature, Signature } from "@ext/git/core/GitMergeRequest/model/MergeRequest";
import t, { pluralize } from "@ext/localization/locale/translate";

export const Bold = styled.span`
	font-weight: 500;
`;

export const Inline = styled.span`
	display: flex;
	align-items: center;
	gap: 0.3em;
	flex-wrap: wrap;
`;

const Block = styled.div`
	display: flex;
	gap: 0.3em;
	flex-wrap: wrap;
	word-break: break-word;
`;

export const Avatar = styled(UserCircle)`
	font-size: 0.65em;
`;

export const FromWhere = ({ from, where, created }: { from: Signature; where: string; created: Date }) => {
	return (
		<Block>
			<Inline>
				<span>{t("git.merge-requests.by")}</span>
				<Author author={from} />
			</Inline>
			<Inline>
				<span>{t("git.merge-requests.into")}</span>
				<BlueBranch name={where} />
			</Inline>
			<Inline>
				<Bold>
					<Date date={created.toString()} />
				</Bold>
			</Inline>
		</Block>
	);
};

const Author = ({ author, you }: { author: Signature; you?: boolean }) => {
	if (!author) return "Invalid author";

	return (
		<Tooltip content={author.email} interactive>
			<Inline>
				<Avatar name={author.name} />
				<Bold>{author.name}</Bold>
				{you && <span>({t("git.merge-requests.you")})</span>}
			</Inline>
		</Tooltip>
	);
};

type ApprovalProps = {
	status: "approved" | "unapproved";
	since?: Date;
};

const Approval = ({ status, since }: ApprovalProps) => {
	if (status === "approved")
		return (
			<Tooltip
				content={
					<Inline>
						{t("git.merge-requests.approval.approved")}
						<Date date={since.toString()} />
					</Inline>
				}
				placement="right"
			>
				<Inline>
					<Icon code="approved" />
				</Inline>
			</Tooltip>
		);

	if (status === "unapproved")
		return (
			<Tooltip content={t("git.merge-requests.approval.unapproved")} placement="right">
				<Inline>
					<Icon code="unapproved" />
				</Inline>
			</Tooltip>
		);
};

const Assignee = ({ assignee, comments }: { assignee: ApprovalSignature; comments: number }) => {
	const { setApprove, approvedAt, canSetApprove } = useApproval({ assignee });

	const Wrapper = styled.div<{ you?: boolean }>`
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.3rem 0.7em;
		margin: 0 -0.7em;

		${(props) =>
			props.you &&
			css`
				cursor: pointer;
				:hover {
					background-color: #ebebeb;
				}
			`};
	`;

	const Part = styled.div<{ you?: boolean; normalFont?: boolean }>`
		display: flex;
		gap: 1em;

		${(props) =>
			props.normalFont &&
			css`
				font-size: 14px;
			`}
	`;

	return (
		<Wrapper you={canSetApprove} onClick={() => (canSetApprove ? setApprove(!approvedAt) : null)}>
			<Part>
				<Approval status={approvedAt ? "approved" : "unapproved"} since={approvedAt} />
				<Author author={assignee} you={canSetApprove} />
			</Part>
			<Part normalFont>
				<VersionControlCommentCount count={comments} />
			</Part>
		</Wrapper>
	);
};

const Assignees = ({ assignees }: { assignees: ApprovalSignature[] }) => {
	const { comments } = useReviewerComments({ authors: assignees });
	const totalCommentCount = Object.values(comments).reduce((acc, curr) => acc + curr.total, 0);

	const Header = styled.span`
		display: flex;
		align-items: center;
		justify-content: space-between;
	`;

	const Wrapper = styled.div`
		margin: 1rem 0;
	`;

	return (
		<Wrapper>
			<Header>
				<span>{t("git.merge-requests.assignees")}</span>
				<span>
					{pluralize(totalCommentCount, {
						zero: t("git.merge-requests.comments.zero"),
						one: t("git.merge-requests.comments.one"),
						few: t("git.merge-requests.comments.few"),
						many: t("git.merge-requests.comments.many"),
					})}
				</span>
			</Header>
			{assignees.map((assignee, idx) => (
				<Assignee key={idx} comments={comments[assignee.email]?.total} assignee={assignee} />
			))}
		</Wrapper>
	);
};

export default Assignees;
