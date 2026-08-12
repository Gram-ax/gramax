import useStickyTableStyles, {
	type StickyTableStyleOptions,
	TOP_PADDING,
} from "@components/StickyWrapper/hooks/useStickyTableStyles";
import { type MutableRefObject, type RefObject, useCallback, useEffect, useRef } from "react";

export { TOP_PADDING };

const headerRowSelector = "tbody tr:first-child";
const controlsContainerHorizontalSelector =
	":scope > .width-wrapper-container > .width-wrapper > .scrollableContent > .table-actions > .table-controller > .controls-container-horizontal";
const lastRowSelector = "tbody tr:nth-last-child(-n+5)";

type UseStickyTableHeaderParams = StickyTableStyleOptions & {
	headerRowRef?: MutableRefObject<HTMLTableRowElement>;
	stickyTableWrapperRef: MutableRefObject<HTMLDivElement>;
	tableRef: RefObject<HTMLTableElement>;
	topShadowContainerRef: MutableRefObject<HTMLDivElement>;
};

const useStickyTableHeader = (params: UseStickyTableHeaderParams) => {
	const { enableStickyRow, headerRowRef, stickyTableWrapperRef, tableRef, topShadowContainerRef } = params;
	const { applyStickyHeaderStyles, resetStickyHeaderStyles } = useStickyTableStyles(params);

	const headerHeightRef = useRef<number>(0);
	const borderHeightRef = useRef<number>(0);

	const verticalRef = useRef<HTMLElement>(null);
	const horizontalRef = useRef<HTMLElement>(null);

	const rafIdRef = useRef<number | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const mutationObserverRef = useRef<MutationObserver | null>(null);

	const getHeaderRow = useCallback(
		() =>
			(headerRowRef?.current || tableRef.current?.querySelector<HTMLTableRowElement>(headerRowSelector)) ?? null,
		[headerRowRef, tableRef],
	);

	const getControlsContainerHorizontal = useCallback(
		() => stickyTableWrapperRef.current?.querySelector<HTMLDivElement>(controlsContainerHorizontalSelector) ?? null,
		[stickyTableWrapperRef],
	);

	const findScrollableParents = useCallback(() => {
		let vertical: HTMLElement | null = null;
		let horizontal: HTMLElement | null = null;

		let current = tableRef.current?.parentElement ?? null;
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
	}, [tableRef]);

	const setScrollLeft = useCallback(
		(scrollLeft: number) => {
			const horizontal = horizontalRef.current;
			const headerRow = getHeaderRow();
			const controlsContainerHorizontal = getControlsContainerHorizontal();
			const topShadowContainer = topShadowContainerRef.current;

			if (horizontal && horizontal.scrollLeft !== scrollLeft) horizontal.scrollLeft = scrollLeft;
			if (headerRow && headerRow.scrollLeft !== scrollLeft) headerRow.scrollLeft = scrollLeft;
			if (controlsContainerHorizontal && controlsContainerHorizontal.scrollLeft !== scrollLeft) {
				controlsContainerHorizontal.scrollLeft = scrollLeft;
			}
			if (topShadowContainer && topShadowContainer.scrollLeft !== scrollLeft) {
				topShadowContainer.scrollLeft = scrollLeft;
			}
		},
		[getControlsContainerHorizontal, getHeaderRow, topShadowContainerRef],
	);

	const horizontalRowScroll = useCallback(() => {
		if (!horizontalRef.current) return;
		setScrollLeft(horizontalRef.current.scrollLeft);
	}, [setScrollLeft]);

	const headerRowScroll = useCallback(() => {
		const headerRow = getHeaderRow();
		if (!headerRow) return;
		setScrollLeft(headerRow.scrollLeft);
	}, [getHeaderRow, setScrollLeft]);

	const computeBorderHeight = useCallback(() => {
		const headerRow = getHeaderRow();
		if (!headerRow?.firstElementChild) return;
		const cellStyles = window.getComputedStyle(headerRow.firstElementChild);
		borderHeightRef.current = parseFloat(cellStyles.borderTopWidth) + parseFloat(cellStyles.borderBottomWidth);
	}, [getHeaderRow]);

	const computeStyles = useCallback(() => {
		const table = tableRef.current;
		const headerRow = getHeaderRow();
		const vertical = verticalRef.current;

		if (!enableStickyRow || !table || !headerRow || !vertical) {
			headerHeightRef.current = 0;
			resetStickyHeaderStyles();
			return;
		}

		const rect = table.getBoundingClientRect();
		const verticalRect = vertical.getBoundingClientRect();

		const headerRect = headerRow.getBoundingClientRect();
		const tbodyTop = rect.top - headerHeightRef.current;

		const sticked = !!headerHeightRef.current;
		const borderHeight = sticked ? borderHeightRef.current : 0;
		const paddingTop = sticked ? TOP_PADDING : 0;
		const headerRectHeight = headerRect.height - borderHeight - paddingTop;

		const shouldStick =
			rect.top - headerHeightRef.current <= verticalRect.top + TOP_PADDING &&
			headerRectHeight <= vertical.clientHeight / 2;

		headerHeightRef.current = 0;

		const lastRows = table.querySelectorAll<HTMLTableRowElement>(lastRowSelector);
		if (!lastRows.length) {
			resetStickyHeaderStyles();
			return;
		}

		const firstRowRect = lastRows[0].getBoundingClientRect();
		const lastRowRect = lastRows[lastRows.length - 1].getBoundingClientRect();

		const top = Math.min(
			Math.max(
				lastRowRect.bottom - verticalRect.top - vertical.clientHeight / 2,
				firstRowRect.top - verticalRect.top,
			) - headerRectHeight,
			0,
		);

		if (shouldStick && top + TOP_PADDING >= tbodyTop && top > -headerRectHeight - 1) {
			headerHeightRef.current = headerRectHeight;

			const horizontal = horizontalRef.current;
			let containerWidth = headerRect.width;
			const scrollLeft = horizontal?.scrollLeft ?? 0;

			if (headerRow.scrollLeft !== scrollLeft) headerRow.scrollLeft = scrollLeft;

			if (horizontal) {
				const cRect = horizontal.getBoundingClientRect();
				containerWidth = cRect.width;
			}

			applyStickyHeaderStyles({
				tableMarginTop: headerRect.height - paddingTop,
				top,
				width: containerWidth,
			});
			return;
		}

		resetStickyHeaderStyles();
	}, [applyStickyHeaderStyles, enableStickyRow, getHeaderRow, resetStickyHeaderStyles, tableRef]);

	const scheduleUpdate = useCallback(() => {
		if (rafIdRef.current != null) return;
		rafIdRef.current = requestAnimationFrame(() => {
			rafIdRef.current = null;
			computeStyles();
		});
	}, [computeStyles]);

	useEffect(() => {
		const table = tableRef.current;
		const headerRow = getHeaderRow();

		if (!enableStickyRow || !table || !headerRow) {
			headerHeightRef.current = 0;
			resetStickyHeaderStyles();
			return;
		}

		computeBorderHeight();
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
	}, [
		computeBorderHeight,
		computeStyles,
		enableStickyRow,
		findScrollableParents,
		getHeaderRow,
		headerRowScroll,
		horizontalRowScroll,
		resetStickyHeaderStyles,
		scheduleUpdate,
		tableRef,
	]);
};

export default useStickyTableHeader;
