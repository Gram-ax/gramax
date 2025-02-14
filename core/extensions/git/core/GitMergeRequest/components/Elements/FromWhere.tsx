import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import FormattedBranch from "@ext/git/actions/Branch/components/FormattedBranch";

export const LargeIcon = styled(Icon)`
	font-size: 16px;
	margin: 0;
	padding: 0;
`;

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: start;
	gap: 0.33em;
`;

const FromWhere = ({ from, where }: { from: string; where: string }) => {
	return (
		<Wrapper>
			<FormattedBranch name={from} />
			<LargeIcon strokeWidth={1.5} code="arrow-right" />
			<FormattedBranch name={where} />
		</Wrapper>
	);
};

export default FromWhere;
