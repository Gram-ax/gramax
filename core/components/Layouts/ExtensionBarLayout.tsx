import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import BarLayout from "./BarLayout";

const ExtensionBarLayout = styled(
	({
		leftExtensions,
		rightExtensions,
		className,
		style,
		dataState,
		...props
	}: {
		leftExtensions?: JSX.Element[];
		rightExtensions?: JSX.Element[];
		height?: string | number;
		gap?: number;
		padding?: string | { top?: string; right?: string; bottom?: string; left?: string };
		background?: string;
		className?: string;
		style?: React.CSSProperties;
		dataState?: string;
	}) => {
		return (
			<div className={cn("status-bar", className)} data-state={dataState} style={style}>
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
		gap: 0.6rem;
	}

	.elements {
		display: flex;
		gap: 0.6rem;
	}

	.elements.left {
		overflow: hidden;
	}
`;

export default ExtensionBarLayout;
