import { classNames } from "@components/libs/classNames";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import styled from "@emotion/styled";
import ShadowBox from "@ext/markdown/elements/table/render/component/ShadowBox";
import { useCallback, useEffect, useRef, useState } from "react";

export const CELL_MIN_WIDTH = "3em";

const TableWrapper = ({ children, className }: { children: JSX.Element; className?: string }) => {
	const [rightWidth, setRightWidth] = useState(0);
	const [leftWidth, setLeftWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const isPin = SidebarsIsPinService.value;
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const setWidth = useCallback(() => {
		const scroll = scrollContainerRef.current;
		if (scroll && scroll.firstElementChild) {
			const containerRect = scroll.getBoundingClientRect();
			const childRect = scroll.firstElementChild.getBoundingClientRect();
			setLeftWidth(containerRect.left - childRect.left);
			setRightWidth(childRect.right - containerRect.right);
		}
	}, [scrollContainerRef]);

	useEffect(() => {
		if (!scrollContainerRef.current) return;
		const handleResize = (entries: ResizeObserverEntry[]) => {
			for (const entry of entries) {
				setHeight(entry.target.clientHeight);
			}
			setWidth();
		};

		const observer = new ResizeObserver(handleResize);
		observer.observe(scrollContainerRef.current.firstElementChild);

		return () => {
			observer.disconnect();
		};
	}, [scrollContainerRef]);

	useEffect(() => {
		setWidth();
	}, [isPin]);
	return (
		<div className={classNames(className, { expanded: !isPin })}>
			<div ref={scrollContainerRef} className={"scrollableСontent"} onScroll={setWidth}>
				{children}
			</div>
			<ShadowBox width={leftWidth} height={height} direction="left" />
			<ShadowBox width={rightWidth} height={height} direction="right" />
		</div>
	);
};

export default styled(TableWrapper)`
	position: relative;
	&.expanded {
		width: 90vw;
		margin-left: calc(max(90vw - var(--article-max-width), 0px) / -2);

		.scrollableСontent {
			padding-left: calc((90vw - var(--article-max-width)) / 2);
		}
	}

	.scrollableСontent {
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
