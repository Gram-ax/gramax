import { cn } from "@core-ui/utils/cn";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { type CSSProperties, forwardRef, type ReactNode, type RefObject } from "react";

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

const LeftSidebar = forwardRef((props: LeftSidebarProps, ref: RefObject<HTMLDivElement>) => {
	const { children, boxShadowStyles, sidebarTop, sidebarBottom, style, className } = props;
	const { onContentMouseEnter, onContentMouseLeave } = props;

	return (
		<div className={cn("flex w-[inherit] h-[inherit] flex-col", className)} style={style}>
			{sidebarTop}
			<ScrollShadowContainer
				className="h-full w-full left-navigation-content"
				onMouseEnter={onContentMouseEnter}
				onMouseLeave={onContentMouseLeave}
				ref={ref}
				style={boxShadowStyles}
			>
				{children}
			</ScrollShadowContainer>
			{sidebarBottom}
		</div>
	);
});

export default LeftSidebar;
