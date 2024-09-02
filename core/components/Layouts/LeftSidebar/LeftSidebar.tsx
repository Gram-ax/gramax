import styled from "@emotion/styled";
import { ReactNode, useState } from "react";
import Scrollable from "../ScrollableElement";
import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { getBackendOptions } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";

interface LeftSidebarProps {
	children: ReactNode;
	shadow?: boolean;
	sidebarTop?: JSX.Element;
	sidebarBottom?: JSX.Element;
	hideScroll?: boolean;
	onContentMouseEnter?: () => void;
	onContentMouseLeave?: () => void;
	className?: string;
}

const LeftSidebar = (props: LeftSidebarProps) => {
	const { children, shadow = true, sidebarTop, sidebarBottom, hideScroll, className } = props;
	const { onContentMouseEnter, onContentMouseLeave } = props;
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
			<DndProvider backend={ModifiedBackend} options={getBackendOptions()}>
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
			</DndProvider>
			<div
				style={{
					boxShadow: shadow && hasScroll ? (isBottom ? null : "var(--bar-shadow-vertical)") : null,
				}}
			>
				{sidebarBottom}
			</div>
		</div>
	);
};

export default styled(LeftSidebar)`
	display: flex;
	width: inherit;
	height: inherit;
	flex-direction: column;
`;
