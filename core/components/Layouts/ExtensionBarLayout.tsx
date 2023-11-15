import styled from "@emotion/styled";
import BarLayout from "./BarLayout";

const ExtensionBarLayout = styled(
	({
		leftExtensions,
		rightExtensions,
		className,
		...props
	}: {
		leftExtensions?: JSX.Element[];
		rightExtensions?: JSX.Element[];
		height?: string | number;
		gap?: number;
		padding?: string | { top?: string; right?: string; bottom?: string; left?: string };
		background?: string;
		className?: string;
	}) => {
		return (
			<div className={"status-bar " + className}>
				<BarLayout {...props} className="bar-layout">
					<div className="left-right-elements">
						<div className="elements left">{leftExtensions}</div>
						<div className="elements right">{rightExtensions}</div>
					</div>
				</BarLayout>
			</div>
		);
	},
)`
	background: ${(p) => p.background};
	width: 100%;

	.left-right-elements {
		display: flex;
		height: 100%;
		width: 100%;
		justify-content: space-between;
	}

	.elements {
		display: flex;
		gap: 8px;
	}

	.elements.left {
		overflow: hidden;
	}
`;

export default ExtensionBarLayout;
