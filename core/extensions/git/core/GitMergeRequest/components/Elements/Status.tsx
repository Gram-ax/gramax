import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

export type MergeRequestStatus = "draft" | "in-progress" | "approved";

export type StatusProps = {
	status: MergeRequestStatus;
};

const Base = styled.span`
	border-radius: 1.2rem;
	border: 0.08rem solid #00000033;
	padding: 0 0.5rem;
	text-align: center;
	white-space: nowrap;
`;

const Draft = styled(Base)`
	background-color: #e5e7eb;
	color: #4b5563;
`;

const InProgress = styled(Base)`
	background-color: #a5f3fc;
	color: #0e7490;
`;

const Approved = styled(Base)`
	background-color: #a7f3d0;
	color: #047857;
`;

const Status = ({ status }: StatusProps) => {
	if (status === "draft")
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Draft>{t("git.merge-requests.status.draft")}</Draft>
				</TooltipTrigger>
				<TooltipContent>{t("git.merge-requests.status.draft-tooltip")}</TooltipContent>
			</Tooltip>
		);
	if (status === "in-progress")
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<InProgress>{t("git.merge-requests.status.in-progress")}</InProgress>
				</TooltipTrigger>
				<TooltipContent>{t("git.merge-requests.status.in-progress-tooltip")}</TooltipContent>
			</Tooltip>
		);
	if (status === "approved")
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Approved>{t("git.merge-requests.status.approved")}</Approved>
				</TooltipTrigger>
				<TooltipContent>{t("git.merge-requests.status.approved-tooltip")}</TooltipContent>
			</Tooltip>
		);
};

export default Status;
