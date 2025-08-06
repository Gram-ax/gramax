import styled from "@emotion/styled";
import ModifiedBackend, { useDragDrop } from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { CSSProperties, ReactNode } from "react";
import { DndProvider } from "react-dnd";
import Scrollable from "../ScrollableElement";

interface LeftSidebarProps {
	children: ReactNode;
	shadow?: boolean;
	boxShadowStyles?: { top?: string; bottom?: string };
	sidebarTop?: JSX.Element;
	sidebarBottom?: JSX.Element;
	style?: CSSProperties;
	onContentMouseEnter?: () => void;
	onContentMouseLeave?: () => void;
	className?: string;
}

const LeftSidebar = (props: LeftSidebarProps) => {
	const { children, shadow = true, boxShadowStyles, sidebarTop, sidebarBottom, style, className } = props;
	const { onContentMouseEnter, onContentMouseLeave } = props;
	const { backend, options } = useDragDrop();

	return (
		<div className={className} style={style}>
			{sidebarTop}
			<DndProvider backend={(manager) => ModifiedBackend(backend(manager))} options={options}>
				<Scrollable
					style={style}
					showTopBottomShadow={shadow}
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
