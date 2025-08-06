import Date from "@components/Atoms/Date";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import IsMobileService from "@core-ui/ContextServices/isMobileService";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";

const DateInfo = ({ date }: { date: string }) => {
	const isMobile = IsMobileService.value;
	if (!isMobile) return <Date date={date} />;

	return (
		<Tooltip content={<Date date={date} />} hideInMobile={false}>
			<Icon
				code="history"
				onClickCapture={(e) => {
					e.stopPropagation();
					e.preventDefault();
				}}
			/>
		</Tooltip>
	);
};

const GitDateInfo = styled(
	({ className, data }: { className?: string; data: { lastCommitAuthor?: string; lastCommitModify: string } }) => {
		return (
			<div className={"branch-info " + className}>
				{data.lastCommitAuthor ? data.lastCommitAuthor + " / " : ""}
				<DateInfo date={data.lastCommitModify} />
			</div>
		);
	},
)`
	white-space: nowrap;
	font-size: 12px;
	${cssMedia.moreThanNarrow} {
		color: var(--color-placeholder);
	}
`;

export default GitDateInfo;
