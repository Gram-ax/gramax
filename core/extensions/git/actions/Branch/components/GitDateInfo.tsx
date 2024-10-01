import Date from "@components/Atoms/Date";
import styled from "@emotion/styled";

const GitDateInfo = styled(
	({ className, data }: { className?: string; data: { lastCommitAuthor?: string; lastCommitModify: string } }) => {
		return (
			<div className={"branch-info " + className}>
				{data.lastCommitAuthor ? data.lastCommitAuthor + " / " : ""}
				<Date date={data.lastCommitModify} />
			</div>
		);
	},
)`
	white-space: nowrap;
	color: var(--color-placeholder);
	font-size: 12px;
`;

export default GitDateInfo;
