import styled from "@emotion/styled";
import { Property } from "csstype";
import Fence from "../../extensions/markdown/elements/fence/render/component/Fence";

const SmallFence = styled(
	({
		className,
		value,
		overflow,
	}: {
		value: string;
		fixWidth?: boolean;
		overflow?: Property.Overflow;
		className?: string;
	}) => {
		return (
			<div className={className}>
				<Fence value={value} overflow={overflow} />
			</div>
		);
	}
)`
	${(p) => (p.fixWidth ? "flex: 1; overflow: hidden;" : "")}

	> pre {
		padding: 2px 6px;
		margin: 0px !important;

		> div {
			padding: 0px !important;
		}

		.hover-right-button {
			display: none;
		}
	}
`;

export default SmallFence;
