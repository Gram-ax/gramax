import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";

const PullPushCounter = styled(
	({ pullCounter, pushCounter, className }: { pullCounter: number; pushCounter: number; className?: string }) => {
		if (!(pullCounter || pushCounter)) return null;
		return (
			<div className={className}>
				<div className="counter">
					{pullCounter}
					<Icon code="arrow-down-long"></Icon>
				</div>
				<div className="counter">
					{pushCounter}
					<Icon code="arrow-up-long"></Icon>
				</div>
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
		gap: 1px;
	}
	font-size: 10px;
	i {
		font-size: 8px;
	}
`;

export default PullPushCounter;
