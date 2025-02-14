import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";

const Wrapper = styled.div`
	font-size: 10px;
	display: flex;
	align-items: center;
	height: 100%;
	padding: 0;

	i {
		padding-top: 0.05rem;
		font-size: 8px;
	}
`;

export type PullPushCounterProps = {
	pullCounter: number;
	pushCounter: number;
	className?: string;
};

const PullPushCounter = ({ pullCounter, pushCounter, className }: PullPushCounterProps) => {
	const showPullCounter = pullCounter > 0 || pushCounter > 0;
	const showPushCounter = pushCounter > 0;

	return (
		<Wrapper className={className}>
			{showPushCounter && (
				<>
					{pushCounter}
					<Icon code="move-up" strokeWidth="2" viewBox="2 1 20 20"></Icon>
				</>
			)}
			{showPullCounter && (
				<>
					{pullCounter}
					<Icon code="move-down" strokeWidth="2" viewBox="2 4 20 20"></Icon>
				</>
			)}
		</Wrapper>
	);
};

export default PullPushCounter;
