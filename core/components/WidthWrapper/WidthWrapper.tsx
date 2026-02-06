import { classNames } from "@components/libs/classNames";
import ShadowBox from "@components/WidthWrapper/ShadowBox";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import useShowMainLangContentPreview from "@core-ui/hooks/useShowMainLangContentPreview";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { VERTICAL_TOP_OFFSET } from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import { PADDING_TOP_BOTTOM } from "@ext/markdown/elements/table/render/component/TableWrapper";
import { CSSProperties, RefObject, useCallback, useLayoutEffect, useRef, useState } from "react";

export const CELL_MIN_WIDTH = "3em";

const calculateContentWidth = (element: Element | null): number => {
	if (!element) return 0;

	const isTable = element.firstElementChild?.tagName.toLowerCase() === "table";
	if (!isTable) return element.clientWidth;

	return element.firstElementChild.clientWidth;
};

export interface WidthWrapperProps {
	children: JSX.Element;
	additional?: JSX.Element;
	className?: string;
	"data-wrapper"?: string;
	tableRef?: RefObject<HTMLTableElement>;
	disableWrapper?: boolean;
}

const WidthWrapper = (props: WidthWrapperProps) => {
	const { children, className, "data-wrapper": dataWrapper, disableWrapper, additional } = props;
	const [rightWidth, setRightWidth] = useState(0);
	const [leftWidth, setLeftWidth] = useState(0);
	const [height, setHeight] = useState(0);
	const [wrapperSize, setWrapperSize] = useState(0);
	const isShowMainLangContentPreview = useShowMainLangContentPreview();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const isPin = SidebarsIsPinService.value.left;
	const leftNavigation = SidebarsIsOpenService?.transitionEndIsLeftOpen;

	let articleRef = ArticleRefService.value;
	if (disableWrapper) articleRef = null;

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
		const first = articleRef?.current?.firstElementChild;
		const articleRefWidth = first?.clientWidth;

		const scrollContainer = scrollContainerRef.current;
		if (!scrollContainer) return;

		const scrollContentRef = scrollContainer?.firstElementChild;
		const scrollContentRefWidth = calculateContentWidth(scrollContentRef);

		const editorWidth = first?.firstElementChild.clientWidth;
		const newWrapperSize = (articleRefWidth - editorWidth) / 2;

		setHeight(scrollContainer.clientHeight);
		setWrapperSize(scrollContentRefWidth >= editorWidth ? newWrapperSize : 0);
	}, [articleRef, scrollContainerRef.current]);

	useLayoutEffect(() => {
		if (!scrollContainerRef.current) return;

		const handleResize = () => {
			setWidth();
			resizeWrapper();
		};

		const observer = new ResizeObserver(handleResize);
		observer.observe(scrollContainerRef.current.firstElementChild);

		window.addEventListener("resize", handleResize);

		return () => {
			observer.disconnect();
			window.removeEventListener("resize", handleResize);
		};
	}, [scrollContainerRef.current]);

	useLayoutEffect(() => {
		resizeWrapper();
		setWidth();
	}, [isPin, leftNavigation]);

	const getWidth = useCallback((): CSSProperties => {
		if (isShowMainLangContentPreview) return {};
		if (typeof isPin === "undefined" || wrapperSize <= 0) return {};
		if (!articleRef?.current) return {};

		const parentElement = scrollContainerRef?.current?.parentElement.parentElement;
		const nodeWidth = parentElement.clientWidth;
		const editorWidth = articleRef?.current.firstElementChild?.firstElementChild.clientWidth;
		const addMargin = editorWidth - nodeWidth;

		if (isPin) {
			return {
				width: `calc(${
					articleRef?.current.firstElementChild.firstElementChild.clientWidth + wrapperSize * 2
				}px - 1em)`,
				marginLeft: `calc(0.5em - ${wrapperSize}px - ${addMargin}px)`,
			};
		}

		const parent = articleRef.current;
		const editor = parent.firstElementChild.firstElementChild;

		return {
			width: `calc(${parent.clientWidth}px - 2.5rem)`,
			marginLeft: `calc(-${(parent.clientWidth - editor.clientWidth) / 2}px + 30px - ${addMargin}px)`, // 30px - width of left navigation in inverted form
		};
	}, [isShowMainLangContentPreview, isPin, wrapperSize, articleRef?.current]);

	return (
		<div
			className={classNames(
				className,
				{
					center:
						disableWrapper || isShowMainLangContentPreview
							? scrollContainerRef.current?.parentElement.clientWidth <
								scrollContainerRef.current?.firstElementChild?.firstElementChild?.clientWidth
							: wrapperSize > 0,
				},
				["width-wrapper"],
			)}
			data-wrapper={dataWrapper}
			style={{ ...getWidth() }}
		>
			<div className={"scrollableContent"} onScroll={setWidth} ref={scrollContainerRef}>
				{children}
			</div>
			{additional}
			<ShadowBox direction="left" height={height} width={leftWidth} />
			<ShadowBox direction="right" height={height} width={rightWidth} />
		</div>
	);
};

export default styled(WidthWrapper)`
	position: relative;
	z-index: 1;

	&:has(.scrollableContent > div[data-table-wrapper]) {
		padding-bottom: calc(${PADDING_TOP_BOTTOM} - ${VERTICAL_TOP_OFFSET});
		.scrollableContent > div[data-table-wrapper] {
			padding-bottom: ${VERTICAL_TOP_OFFSET};
		}
	}

	${cssMedia.medium} {
		&.center {
			width: 100% !important;
			margin-left: 0 !important;
		}
	}

	&.center {
		display: flex;
		justify-content: center;

		.scrollableContent {
			overflow-x: auto;
			overflow-y: hidden;
			position: relative;
		}
	}

	&:not(.center):has(table) .shadow-box.left,
	&:not(.center) .scrollableContent:has(table) {
		margin-left: -1.5em;
	}

	@media not print {
		table {
			width: max-content;
			max-width: none;

			th,
			td {
				min-width: ${CELL_MIN_WIDTH};
			}
		}
	}

	@media print {
		margin-left: 0 !important;
		width: auto !important;
		justify-content: unset !important;

		table td,
		table th {
			page-break-inside: avoid;
		}
		table colgroup {
			display: none;
		}
	}
`;
