import styled from "@emotion/styled";
import Icon from "../../../../../components/Atoms/Icon";
import Tooltip from "../../../../../components/Atoms/Tooltip";
import DateUtils from "../../../../../ui-logic/utils/dateUtils";

const SmallBranchInfo = styled(
	({ className, data }: { className?: string; data: { lastCommitAuthor: string; lastCommitModify: string } }) => {
		const relativeDate = DateUtils.getRelativeDateTime(data.lastCommitModify);
		return (
			<Tooltip
				content={
					<span>
						{data.lastCommitAuthor} / {relativeDate}
					</span>
				}
			>
				<div className={className}>
					<Icon code="circle-alert"></Icon>
				</div>
			</Tooltip>
		);
	},
)`
	color: var(--color-placeholder);
	font-size: 12px;
`;

export default SmallBranchInfo;
