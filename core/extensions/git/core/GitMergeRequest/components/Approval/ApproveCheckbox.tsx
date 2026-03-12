import Date from "@components/Atoms/Date";
import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

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
			<Tooltip>
				<TooltipTrigger asChild>
					<Wrapper>
						<Icon code="approved" />
					</Wrapper>
				</TooltipTrigger>
				<TooltipContent side="right">
					<Wrapper>
						<span>{t("git.merge-requests.approval.approved")}</span>
						<Date date={since.toString()} />
					</Wrapper>
				</TooltipContent>
			</Tooltip>
		);

	if (status === "unapproved")
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Wrapper>
						<Icon code="unapproved" />
					</Wrapper>
				</TooltipTrigger>
				<TooltipContent side="right">{t("git.merge-requests.approval.unapproved")}</TooltipContent>
			</Tooltip>
		);
};

export default ApproveCheckbox;
