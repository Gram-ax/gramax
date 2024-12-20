import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

export type MergeRequestStatus = "draft" | "in-progress" | "approved";

export type StatusProps = {
	status: MergeRequestStatus;
};

const Base = styled.span`
	border-radius: 1.2rem;
	border: 1.3px solid #00000033;
	padding: 0 0.5rem;
	line-height: 1.3em;
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
			<Tooltip content={t("git.merge-requests.status.draft-tooltip")}>
				<Draft>{t("git.merge-requests.status.draft")}</Draft>
			</Tooltip>
		);
	if (status === "in-progress")
		return (
			<Tooltip content={t("git.merge-requests.status.in-progress-tooltip")}>
				<InProgress>{t("git.merge-requests.status.in-progress")}</InProgress>
			</Tooltip>
		);
	if (status === "approved")
		return (
			<Tooltip content={t("git.merge-requests.status.approved-tooltip")}>
				<Approved>{t("git.merge-requests.status.approved")}</Approved>
			</Tooltip>
		);
};

export default Status;
