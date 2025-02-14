import useDragScrolling from "@core-ui/hooks/useDragScrolling";
import { classNames } from "@components/libs/classNames";
import scrollUtils from "@core-ui/utils/scrollUtils";
import styled from "@emotion/styled";
import { forwardRef, MutableRefObject, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

interface ScrollableProps {
	children: ReactNode;
	showTopBottomShadow?: boolean;
	boxShadowStyles?: { top?: string; bottom?: string };
	hideScroll?: boolean;
	onScroll?: (isTop: boolean, isBottom: boolean) => void;
	hasScroll?: (hasScroll: boolean) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	className?: string;
}

const Scrollable = forwardRef((props: ScrollableProps, ref: MutableRefObject<HTMLDivElement>) => {
	const { children, onScroll, hasScroll, onMouseEnter, onMouseLeave, className, showTopBottomShadow = true } = props;
	const [containerWidth, setContainerWidth] = useState(0);
	const containerRef = ref || useRef<HTMLDivElement>(null);
	const [hasElementScroll, setHasElementScroll] = useState(false);
	const [isBottom, setIsBottom] = useState(false);
	const [isTop, setIsTop] = useState(true);

	useLayoutEffect(() => {
		setContainerWidth(containerRef.current?.getBoundingClientRect().width);
	}, []);

	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => {
			setContainerWidth(containerRef.current?.getBoundingClientRect().width);
		});

		resizeObserver.observe(containerRef.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, [containerRef.current]);

	useEffect(() => {
		if (!containerRef.current) return;
		const scroll = scrollUtils.hasScroll(containerRef.current);
		setHasElementScroll(scroll);
		hasScroll?.(scroll);
	}, [children]);

	useDragScrolling(containerRef);

	return (
		<div
			ref={containerRef}
			className={classNames(className, {
				"has-top-shadow": showTopBottomShadow && hasElementScroll && !isTop,
				"has-bottom-shadow": showTopBottomShadow && hasElementScroll && !isBottom,
			})}
			onMouseEnter={() => {
				if (onMouseEnter) onMouseEnter();
			}}
			onMouseLeave={() => {
				if (onMouseLeave) onMouseLeave();
			}}
			onScroll={() => {
				if (!containerRef.current) return;
				const isTop = scrollUtils.scrollPositionIsTop(containerRef.current);
				const isBottom = scrollUtils.scrollPositionIsBottom(containerRef.current);
				onScroll?.(isTop, isBottom);
				setIsTop(isTop);
				setIsBottom(isBottom);
			}}
		>
			<div style={{ width: containerWidth }} className="scrolling-content">
				{children}
			</div>
		</div>
	);
});

export default styled(Scrollable)`
	width: inherit;
	height: inherit;
	position: relative;
	overflow: hidden;

	&.has-top-shadow {
		box-shadow: ${({ boxShadowStyles }) =>
			boxShadowStyles?.top || `0px 6px 5px -5px rgba(225, 225, 225, 0.5) inset`};
	}

	&.has-bottom-shadow {
		box-shadow: ${({ boxShadowStyles }) =>
			boxShadowStyles?.bottom || `0px -6px 5px -5px rgba(225, 225, 225, 0.5) inset`};
	}

	&.has-top-shadow.has-bottom-shadow {
		box-shadow: ${({ boxShadowStyles }) => `${
			boxShadowStyles?.top || `0px 6px 5px -5px rgba(225, 225, 225, 0.5) inset`
		},
				${boxShadowStyles?.bottom || `0px -6px 5px -5px rgba(225, 225, 225, 0.5) inset`}
			`};
	}

	&:hover {
		overflow-y: auto;
	}

	::-webkit-scrollbar {
		height: var(--scroll-width);
		width: var(--scroll-width);
	}

	${(p) =>
		p.hideScroll &&
		`
		::-webkit-scrollbar {
			height: 0 !important;
			width: 0 !important;
		}
	`}

	.scrolling-content {
		height: 100%;
	}
`;
