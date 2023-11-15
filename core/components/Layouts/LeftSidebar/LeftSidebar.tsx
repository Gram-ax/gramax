import styled from "@emotion/styled";
import { ReactNode, useState } from "react";
import Scrollable from "../ScrollableElement";

const LeftSidebar = styled(
	({
		children,
		shadow = true,
		sidebarTop,
		sidebarBottom,
		hideScroll,
		onContentMouseEnter,
		onContentMouseLeave,
		className,
	}: {
		children: ReactNode;
		shadow?: boolean;
		sidebarTop?: JSX.Element;
		sidebarBottom?: JSX.Element;
		hideScroll?: boolean;
		onContentMouseEnter?: () => void;
		onContentMouseLeave?: () => void;
		className?: string;
	}) => {
		const [hasScroll, setHasScroll] = useState(false);
		const [isBottom, setIsBottom] = useState(false);
		const [isTop, setIsTop] = useState(true);

		return (
			<div className={className}>
				<div
					style={{
						boxShadow: shadow && hasScroll ? (isTop ? null : "var(--bar-shadow-vertical)") : null,
					}}
				>
					{sidebarTop}
				</div>
				<Scrollable
					hideScroll={hideScroll}
					onScroll={(isTop, isBottom) => {
						setIsBottom(isBottom);
						setIsTop(isTop);
					}}
					hasScroll={(scroll) => setHasScroll(scroll)}
					onMouseEnter={onContentMouseEnter}
					onMouseLeave={onContentMouseLeave}
				>
					{children}
				</Scrollable>
				<div
					style={{
						boxShadow: shadow && hasScroll ? (isBottom ? null : "var(--bar-shadow-vertical)") : null,
					}}
				>
					{sidebarBottom}
				</div>
			</div>
		);
	},
)`
	display: flex;
	width: inherit;
	height: inherit;
	flex-direction: column;
`;

export default LeftSidebar;
