import { classNames } from "@components/libs/classNames";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import LeftNavigationIsOpenService from "@core-ui/ContextServices/LeftNavigationIsOpen";
import styled from "@emotion/styled";
import ShadowBox from "@components/WidthWrapper/ShadowBox";
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import { cssMedia } from "@core-ui/utils/cssUtils";

export const CELL_MIN_WIDTH = "3em";

const WidthWrapper = ({ children, className }: { children: JSX.Element; className?: string }) => {
	const [rightWidth, setRightWidth] = useState(0);
	const [leftWidth, setLeftWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const [wrapperSize, setWrapperSize] = useState(0);
	const articleRef = ArticleRefService.value;
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isPin = SidebarsIsPinService.value;
	const leftNavigation = LeftNavigationIsOpenService?.transitionEndIsOpen;

	const setWidth = useCallback(() => {
		const scroll = scrollContainerRef.current;
		if (scroll && scroll.firstElementChild) {
			const containerRect = scroll.getBoundingClientRect();
			const childRect = scroll.firstElementChild.getBoundingClientRect();
			setLeftWidth(containerRect.left - childRect.left);
			setRightWidth(childRect.right - containerRect.right);
		}
	}, [scrollContainerRef.current]);

	const resizeWrapper = useCallback(() => {
		const first = articleRef?.current.firstElementChild;
		const articleRefWidth = first?.clientWidth;
		const scrollContentRefWidth = scrollContainerRef?.current?.firstElementChild.clientWidth;
		const editorWidth = first?.firstElementChild.clientWidth;
		const newWrapperSize = (articleRefWidth - editorWidth) / 2;
		setWrapperSize(scrollContentRefWidth >= editorWidth - 24 ? newWrapperSize : 0);
	}, [articleRef, scrollContainerRef.current]);

	useEffect(() => {
		if (!scrollContainerRef.current) return;
		const handleResize = (entries: ResizeObserverEntry[]) => {
			for (const entry of entries) {
				setHeight(entry.target.clientHeight);
			}
			setWidth();
			resizeWrapper();
		};

		const observer = new ResizeObserver(handleResize);
		observer.observe(scrollContainerRef.current.firstElementChild);
		window.addEventListener("resize", resizeWrapper);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", resizeWrapper);
		};
	}, [scrollContainerRef.current]);

	useLayoutEffect(() => {
		resizeWrapper();
		setWidth();
	}, [leftNavigation]);

	const getWidth = (): CSSProperties => {
		if (typeof isPin !== "undefined" && wrapperSize > 0) {
			if (isPin)
				return {
					width: `calc(${
						articleRef?.current.firstElementChild.firstElementChild.clientWidth + wrapperSize * 2
					}px - 1em)`,
					marginLeft: `calc(0.5em - ${wrapperSize}px)`,
				};
			else {
				const parent = articleRef.current;
				const editor = parent.firstElementChild.firstElementChild;
				return {
					width: `calc(${parent.clientWidth}px - 2.5rem)`,
					marginLeft: `calc(-${(parent.clientWidth - editor.clientWidth) / 2}px + 30px)`, // 30px - ширина левой навигации в свернутом виде
				};
			}
		}
	};

	return (
		<div className={classNames(className, { center: wrapperSize > 0 })} style={{ ...getWidth() }}>
			<div ref={scrollContainerRef} className={"scrollableContent"} onScroll={setWidth}>
				{children}
			</div>
			<ShadowBox width={leftWidth} height={height} direction="left" />
			<ShadowBox width={rightWidth} height={height} direction="right" />
		</div>
	);
};

export default styled(WidthWrapper)`
	position: relative;

	${cssMedia.medium} {
		&.center {
			margin-left: 0 !important;
		}
	}

	&.center {
		display: flex;
		justify-content: center;
	}

	.scrollableContent {
		overflow-x: auto;
	}

	table {
		width: max-content;
		max-width: none;

		th,
		td {
			max-width: 15em;
			min-width: ${CELL_MIN_WIDTH};
			height: 3.4em;
		}
	}
`;
