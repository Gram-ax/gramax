import Date from "@components/Atoms/Date";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

type ApproveCheckbox = {
	status: "approved" | "unapproved";
	since?: Date;
};

const Wrapper = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.15rem;
`;

const ApproveCheckbox = ({ status, since }: ApproveCheckbox) => {
	if (status === "approved")
		return (
			<Tooltip
				content={
					<Wrapper>
						<span>{t("git.merge-requests.approval.approved")}</span>
						<Date date={since.toString()} />
					</Wrapper>
				}
				placement="right"
			>
				<Wrapper>
					<Icon code="approved" />
				</Wrapper>
			</Tooltip>
		);

	if (status === "unapproved")
		return (
			<Tooltip content={t("git.merge-requests.approval.unapproved")} placement="right">
				<Wrapper>
					<Icon code="unapproved" />
				</Wrapper>
			</Tooltip>
		);
};

export default ApproveCheckbox;
