import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";

const PullPushCounter = styled(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	({ pullCounter, pushCounter, className }: { pullCounter: number; pushCounter: number; className?: string }) => {
		const showPullCounter = pullCounter > 0 || pushCounter > 0;
		const showPushCounter = pushCounter > 0;
		return (
			<div className={className}>
				{showPullCounter && (
					<div className="counter">
						{pullCounter}
						<Icon code="move-down" strokeWidth="2.3" viewBox="2 4 20 20"></Icon>
					</div>
				)}
				{showPushCounter && (
					<div className="counter">
						{pushCounter}
						<Icon code="move-up" strokeWidth="2.3" viewBox="2 0 20 20"></Icon>
					</div>
				)}
			</div>
		);
	},
)`
	display: flex;
	gap: 0.1rem;
	.counter {
		display: flex;
		height: 100%;
		align-items: center;
	}
	font-size: 10px;
	i {
		font-size: 8px;
	}
`;

export default PullPushCounter;
