import { classNames } from "@components/libs/classNames";
import ScrollWebkitService from "@core-ui/ContextServices/ScrollWebkit";
import useScrolling from "@core-ui/hooks/useScrolling";
import scrollUtils from "@core-ui/utils/scrollUtils";
import styled from "@emotion/styled";
import { forwardRef, MutableRefObject, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

interface ScrollableProps {
	children: ReactNode;
	hideScroll?: boolean;
	onScroll?: (isTop: boolean, isBottom: boolean) => void;
	hasScroll?: (hasScroll: boolean) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	className?: string;
}

const Scrollable = forwardRef((props: ScrollableProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { children, onScroll, hasScroll, onMouseEnter, onMouseLeave, className } = props;
	const [containerWidth, setContainerWidth] = useState<number>(0);
	const [currentHasScroll, setCurrentHasScroll] = useState(false);
	const [isHover, setIsHover] = useState(false);
	const containerRef = ref || useRef<HTMLDivElement>(null);
	const useDefaultScrollBar = ScrollWebkitService.value;
	const hover = !useDefaultScrollBar && currentHasScroll && isHover;

	useLayoutEffect(() => {
		setContainerWidth(containerRef.current?.getBoundingClientRect().width);
	}, []);

	useEffect(() => {
		if (!containerRef.current) return;
		const scroll = scrollUtils.hasScroll(containerRef.current);
		setCurrentHasScroll(scroll);
		if (hasScroll) hasScroll(scroll);
	}, [children]);

	useScrolling(containerRef);

	return (
		<div
			ref={containerRef}
			className={classNames(className, { hover })}
			onMouseEnter={() => {
				setIsHover(true);
				if (onMouseEnter) onMouseEnter();
			}}
			onMouseLeave={() => {
				setIsHover(false);
				if (onMouseLeave) onMouseLeave();
			}}
			onScroll={() => {
				if (!containerRef.current) return;
				if (!onScroll) return;
				const isTop = scrollUtils.scrollPositionIsTop(containerRef.current);
				const isBottom = scrollUtils.scrollPositionIsBottom(containerRef.current);
				onScroll(isTop, isBottom);
			}}
		>
			<div
				style={useDefaultScrollBar ? null : { width: containerWidth }}
				className={classNames("scrolling-content", { hover })}
			>
				{children}
			</div>
		</div>
	);
});

export default styled(Scrollable)`
	width: inherit;
	height: inherit;
	position: relative;
	overflow-x: hidden;
	overflow-y: auto;

	.scrolling-content {
		height: 100%;
	}

	${(p) =>
		ScrollWebkitService.value
			? `${p.hideScroll ? "overflow: hidden;" : ""}`
			: `
::-webkit-scrollbar {
	height: 0;
	width: 0;
}
${
	p.hideScroll
		? ""
		: `
&.hover {
	::-webkit-scrollbar {
		height: var(--scroll-width);
		width: var(--scroll-width);
	}
}

.scrolling-content.hover {
	position: absolute;
	right: calc(calc(var(--scroll-width) * -1) + 0.25px);
}`
}
`}
`;
