import { useCallback, useEffect, useMemo, useRef, useState } from "react";
export interface StickyTableHeaderState {
	tableStyles: TableStyles;
	headerRowStyles: HeaderRowStyles;
}

type TableStyles = {
	tableMarginTop?: number;
};

type HeaderRowStyles = {
	top?: number;
	width?: number;
};

const headerRowSelector = "tbody tr:first-child";
const controlsContainerHorizontalSelector =
	".width-wrapper > .scrollableContent > .table-actions > .table-controller > .controls-container-horizontal";
const lastRowSelector = "tbody tr:nth-last-child(-n+5)";

export const TOP_PADDING = 20;

type useStickyTableHeaderType = (
	tableRef: React.RefObject<HTMLTableElement>,
	stickyTableWrapperRef: React.MutableRefObject<HTMLDivElement>,
	topShadowContainerRef: React.MutableRefObject<HTMLDivElement>,
) => StickyTableHeaderState;

export const useStickyTableHeader: useStickyTableHeaderType = (
	tableRef,
	stickyTableWrapperRef,
	topShadowContainerRef,
) => {
	const [tableStyles, setTableStyles] = useState<TableStyles>({});
	const [headerRowStyles, setHeaderRowStyles] = useState<HeaderRowStyles>({});

	const headerHeightRef = useRef<number>(0);
	const prevTableStylesRef = useRef<TableStyles>({});
	const prevHeaderRowStylesRef = useRef<HeaderRowStyles>({});

	const verticalRef = useRef<HTMLElement>(null);
	const horizontalRef = useRef<HTMLElement>(null);

	const rafIdRef = useRef<number | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const mutationObserverRef = useRef<MutationObserver | null>(null);

	const controlsContainerHorizontal = useMemo(
		() => stickyTableWrapperRef.current?.querySelector<HTMLDivElement>(controlsContainerHorizontalSelector),
		[stickyTableWrapperRef.current],
	);
	const headerRow = useMemo(
		() => tableRef?.current?.querySelector<HTMLTableRowElement>(headerRowSelector) ?? null,
		[tableRef?.current],
	);

	const findScrollableParents = useCallback(() => {
		let vertical: HTMLElement | null = null;
		let horizontal: HTMLElement | null = null;

		let current = tableRef?.current?.parentElement ?? null;
		while (current && current !== document.body) {
			const style = getComputedStyle(current);

			if (
				!vertical &&
				current.scrollHeight > current.clientHeight &&
				["auto", "scroll"].includes(style.overflowY)
			) {
				vertical = current;
			}

			if (!horizontal && current.classList.contains("scrollableContent")) {
				horizontal = current;
			}

			if (vertical && horizontal) break;
			current = current.parentElement;
		}

		verticalRef.current = vertical;
		horizontalRef.current = horizontal;
	}, [tableRef?.current]);

	const setScrollLeft = useCallback(
		(scrollLeft: number) => {
			if (horizontalRef.current) horizontalRef.current.scrollLeft = scrollLeft;
			if (headerRow) headerRow.scrollLeft = scrollLeft;
			if (controlsContainerHorizontal) controlsContainerHorizontal.scrollLeft = scrollLeft;
			if (topShadowContainerRef?.current) topShadowContainerRef.current.scrollLeft = scrollLeft;
		},
		[horizontalRef.current, headerRow, controlsContainerHorizontal, topShadowContainerRef?.current],
	);

	const horizontalRowScroll = useCallback(() => {
		if (!horizontalRef.current) return;
		setScrollLeft(horizontalRef.current.scrollLeft);
	}, [horizontalRef.current, setScrollLeft]);

	const headerRowScroll = useCallback(() => {
		if (!headerRow) return;
		setScrollLeft(headerRow.scrollLeft);
	}, [headerRow, setScrollLeft]);

	const computeStyles = useCallback(() => {
		const table = tableRef?.current;
		if (!table || !headerRow || !verticalRef.current) return;

		const rect = table.getBoundingClientRect();
		const verticalRect = verticalRef.current.getBoundingClientRect();

		const headerRect = headerRow.getBoundingClientRect();
		const tbodyTop = rect.top - headerHeightRef.current;

		const shouldStick =
			rect.top - headerHeightRef.current <= verticalRect.top + TOP_PADDING &&
			headerRect.height <= verticalRef.current.clientHeight / 2;
		headerHeightRef.current = 0;

		const lastRows = table.querySelectorAll<HTMLTableRowElement>(lastRowSelector);
		const firstRowRect = lastRows[0].getBoundingClientRect();
		const lastRowRect = lastRows[lastRows.length - 1].getBoundingClientRect();

		const top = Math.min(
			Math.max(
				lastRowRect.bottom - verticalRect.top - verticalRef.current.clientHeight / 2,
				firstRowRect.top - verticalRect.top,
			) - headerRect.height,
			TOP_PADDING,
		);

		let nextHeader: HeaderRowStyles = {};
		let nextTableStyles: TableStyles = {};

		if (shouldStick && top >= tbodyTop && top > -headerRect.height - 1) {
			headerHeightRef.current = headerRect.height;
			const horizontal = horizontalRef.current;
			let containerWidth = headerRect.width;

			headerRow.scrollLeft = horizontal.scrollLeft;

			if (horizontal) {
				const cRect = horizontal.getBoundingClientRect();
				containerWidth = cRect.width;
			}

			nextHeader = {
				top,
				width: containerWidth,
			};

			nextTableStyles = { tableMarginTop: headerRect.height };
		}
		if (
			nextHeader.top !== prevHeaderRowStylesRef.current.top ||
			nextHeader.width !== prevHeaderRowStylesRef.current.width
		) {
			prevHeaderRowStylesRef.current = nextHeader;
			setHeaderRowStyles(nextHeader);
		}
		if (nextTableStyles.tableMarginTop !== prevTableStylesRef.current.tableMarginTop) {
			prevTableStylesRef.current = nextTableStyles;
			setTableStyles(nextTableStyles);
		}
	}, [tableRef, headerHeightRef, headerRow]);

	const scheduleUpdate = useCallback(() => {
		if (rafIdRef.current != null) return;
		rafIdRef.current = requestAnimationFrame(() => {
			rafIdRef.current = null;
			computeStyles();
		});
	}, [computeStyles]);

	useEffect(() => {
		const table = tableRef?.current;
		if (!table) {
			if (prevTableStylesRef.current.tableMarginTop) {
				const emptyStyles = {};
				prevTableStylesRef.current = emptyStyles;
				setTableStyles(emptyStyles);
			}

			if (prevHeaderRowStylesRef.current.top || prevHeaderRowStylesRef.current.width) {
				const emptyHeaderStyles = {};
				prevHeaderRowStylesRef.current = emptyHeaderStyles;
				setHeaderRowStyles(emptyHeaderStyles);
			}
			return;
		}
		if (!headerRow) return;

		findScrollableParents();
		computeStyles();

		resizeObserverRef.current?.disconnect();
		resizeObserverRef.current = new ResizeObserver(() => {
			scheduleUpdate();
			findScrollableParents();
		});
		resizeObserverRef.current.observe(table);

		mutationObserverRef.current?.disconnect();
		mutationObserverRef.current = new MutationObserver(() => {
			scheduleUpdate();
		});
		mutationObserverRef.current.observe(table, {
			attributes: true,
			childList: true,
			subtree: true,
		});

		const vertical = verticalRef.current;
		const horizontal = horizontalRef.current;

		const onHeaderRowScroll = () => headerRowScroll();

		const onVerticalScroll = () => scheduleUpdate();
		const onHorizontalScroll = () => horizontalRowScroll();

		if (vertical) {
			vertical.addEventListener("scroll", onVerticalScroll, { passive: true });
		}

		if (horizontal) {
			horizontal.addEventListener("scroll", onHorizontalScroll, { passive: true });
		}
		headerRow.addEventListener("scroll", onHeaderRowScroll, { passive: true });

		const onResize = () => scheduleUpdate();
		window.addEventListener("resize", onResize);

		return () => {
			resizeObserverRef.current?.disconnect();
			mutationObserverRef.current?.disconnect();

			if (vertical) {
				vertical.removeEventListener("scroll", onVerticalScroll);
			}

			if (horizontal) {
				horizontal.removeEventListener("scroll", onHorizontalScroll);
			}

			headerRow.removeEventListener("scroll", onHeaderRowScroll);

			window.removeEventListener("resize", onResize);

			if (rafIdRef.current != null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
		};
	}, [computeStyles, findScrollableParents, headerRowSelector, scheduleUpdate, tableRef, headerRow]);

	return { tableStyles, headerRowStyles };
};

export default useStickyTableHeader;
