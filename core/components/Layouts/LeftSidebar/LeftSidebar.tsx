import styled from "@emotion/styled";
import ModifiedBackend from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { getBackendOptions } from "@minoru/react-dnd-treeview";
import { ReactNode } from "react";
import { DndProvider } from "react-dnd";
import Scrollable from "../ScrollableElement";

interface LeftSidebarProps {
	children: ReactNode;
	shadow?: boolean;
	boxShadowStyles?: { top?: string; bottom?: string };
	sidebarTop?: JSX.Element;
	sidebarBottom?: JSX.Element;
	hideScroll?: boolean;
	onContentMouseEnter?: () => void;
	onContentMouseLeave?: () => void;
	className?: string;
}

const LeftSidebar = (props: LeftSidebarProps) => {
	const { children, shadow = true, boxShadowStyles, sidebarTop, sidebarBottom, hideScroll, className } = props;
	const { onContentMouseEnter, onContentMouseLeave } = props;

	return (
		<div className={className}>
			{sidebarTop}
			<DndProvider backend={ModifiedBackend} options={getBackendOptions()}>
				<Scrollable
					showTopBottomShadow={shadow}
					hideScroll={hideScroll}
					boxShadowStyles={boxShadowStyles}
					onMouseEnter={onContentMouseEnter}
					onMouseLeave={onContentMouseLeave}
				>
					{children}
				</Scrollable>
			</DndProvider>
			{sidebarBottom}
		</div>
	);
};

export default styled(LeftSidebar)`
	display: flex;
	width: inherit;
	height: inherit;
	flex-direction: column;
`;
