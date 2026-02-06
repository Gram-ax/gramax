import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";

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

interface FromWhereProps {
	fromComponent: React.ReactNode;
	whereComponent: React.ReactNode;
}

const FromWhere = (props: FromWhereProps) => {
	const { fromComponent, whereComponent } = props;

	return (
		<Wrapper>
			{fromComponent}
			<LargeIcon code="arrow-right" strokeWidth={1.5} />
			{whereComponent}
		</Wrapper>
	);
};

export default FromWhere;
