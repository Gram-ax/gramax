import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";

export enum BranchStatusEnum {
	MergeRequest = "merge-request",
	Local = "local",
	Remote = "remote",
}

const StatusWrapper = styled.div<{ borderColor?: string }>`
	display: flex;
	align-items: center;
	padding: 0px 4px 0px 2px;
	gap: 4px;
	font-size: 0.75em;
	border-radius: var(--radius-small);
	border: 1px solid ${(p) => p.borderColor || "var(--color-text-accent)"};

	> .circle {
		margin-left: 2px;
		background-color: ${(p) => p.borderColor || "var(--color-text-accent)"};
		padding: 2px;
		border-radius: var(--radius-full);
	}
`;

export const MergeRequestIcon = () => {
	return (
		<Tooltip
			delay={[1000, 0]}
			appendTo={() => document.body}
			place="right"
			content={t("git.merge-requests.branch-tab-tooltip")}
		>
			<StatusWrapper>
				<span className="circle" />
				<span>{t("git.merge-requests.branch-tab-badge")}</span>
			</StatusWrapper>
		</Tooltip>
	);
};

export const RemoteOrLocalIcon = ({ isRemote }: { isRemote: boolean }) => {
	return (
		<Icon
			tooltipDelay={[1000, 0]}
			tooltipAppendTo={() => document.body}
			style={{ padding: 0 }}
			code={isRemote ? "cloud" : "monitor"}
			tooltipPlace="right"
			tooltipContent={isRemote ? t("remote") : t("local")}
		/>
	);
};
