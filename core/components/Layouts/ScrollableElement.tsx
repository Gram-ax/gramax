import ScrollWebkitService from "@core-ui/ContextServices/ScrollWebkit";
import scrollUtils from "@core-ui/utils/scrollUtils";
import styled from "@emotion/styled";
import React, { MutableRefObject, ReactNode, useEffect, useRef, useState } from "react";

const Scrollable = styled(
	React.forwardRef(
		(
			{
				children,
				onScroll,
				hasScroll,
				onMouseEnter,
				onMouseLeave,
				className,
			}: {
				children: ReactNode;
				hideScroll?: boolean;
				onScroll?: (isTop: boolean, isBottom: boolean) => void;
				hasScroll?: (hasScroll: boolean) => void;
				onMouseEnter?: () => void;
				onMouseLeave?: () => void;
				className?: string;
			},
			ref: MutableRefObject<HTMLDivElement>,
		) => {
			const [containerWidth, setContainerWidth] = useState<number>(0);
			const [currenthasScroll, setCurrentHasScroll] = useState(false);
			const [isHover, setIsHover] = useState(false);
			const containerRef = ref ?? useRef<HTMLDivElement>(null);
			const useDefaultScrollBar = ScrollWebkitService.value;

			useEffect(() => {
				setContainerWidth(containerRef.current.getBoundingClientRect().width);
			}, []);

			useEffect(() => {
				const scroll = scrollUtils.hasScroll(containerRef.current);
				setCurrentHasScroll(scroll);
				if (hasScroll) hasScroll(scroll);
			}, [children]);

			return (
				<div
					ref={containerRef}
					className={`${className} ${useDefaultScrollBar ? "" : currenthasScroll && isHover ? "hover" : ""}`}
					onMouseEnter={() => {
						setIsHover(true);
						if (onMouseEnter) onMouseEnter();
					}}
					onMouseLeave={() => {
						setIsHover(false);
						if (onMouseLeave) onMouseLeave();
					}}
					onScroll={() => {
						if (!onScroll) return;
						const isTop = scrollUtils.scrollPositionIsTop(containerRef.current);
						const isBottom = scrollUtils.scrollPositionIsBottom(containerRef.current);
						onScroll(isTop, isBottom);
					}}
				>
					<div
						style={useDefaultScrollBar ? null : { width: containerWidth }}
						className={`scrolling-content ${
							useDefaultScrollBar ? "" : currenthasScroll && isHover ? "hover" : ""
						}`}
					>
						{children}
					</div>
				</div>
			);
		},
	),
)`
	width: inherit;
	height: inherit;
	position: relative;
	overflow-x: hidden;
	overflow-y: scroll;

	${(p) =>
		ScrollWebkitService.value
			? ""
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

export default Scrollable;
