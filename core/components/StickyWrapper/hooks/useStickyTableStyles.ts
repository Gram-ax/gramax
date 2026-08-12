import {
	CONTROLS_CONTAINER_VERTICAL_TOP,
	HELPERS_LEFT,
	HELPERS_TOP,
	VERTICAL_TOP_OFFSET,
} from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import { PADDING_LEFT_RIGHT, PADDING_TOP_BOTTOM } from "@ext/markdown/elements/table/render/components/TableWrapper";
import { type MutableRefObject, type RefObject, useCallback, useEffect, useRef } from "react";

export const TOP_PADDING = 20;
export const STICKY_TABLE_WRAPPER_CLASS_NAME = "sticky-table-wrapper";

const SCROLL_SHADOW_SIZE = "1.25rem";
const ROW_ACTIVE_ATTRIBUTE = "data-sticky-row-active";
const COL_ACTIVE_ATTRIBUTE = "data-sticky-col-active";

const STICKY_VARIABLES = {
	bgColor: "--sticky-bg-color",
	clientWidth: "--sticky-client-width",
	controlsVerticalTop: "--sticky-controls-vertical-top",
	firstColumnWidth: "--sticky-first-column-width",
	firstVerticalPlusDivTop: "--sticky-first-vertical-plus-div-top",
	firstVerticalPlusIconTop: "--sticky-first-vertical-plus-icon-top",
	gridTemplateColumns: "--sticky-grid-template-columns",
	headerTop: "--sticky-header-top",
	headerWidth: "--sticky-header-width",
	helpersLeft: "--sticky-helpers-left",
	helpersTop: "--sticky-helpers-top",
	leftShadowHeight: "--sticky-left-shadow-height",
	leftShadowLeft: "--sticky-left-shadow-left",
	negativeSidePadding: "--sticky-negative-side-padding",
	scrollShadowSize: "--sticky-scroll-shadow-size",
	secondVerticalPlusDivTop: "--sticky-second-vertical-plus-div-top",
	sidePadding: "--sticky-side-padding",
	tableMarginTop: "--sticky-table-margin-top",
	topPadding: "--sticky-top-padding",
	topShadowTop: "--sticky-top-shadow-top",
	verticalTopOffset: "--sticky-vertical-top-offset",
} as const;

export type TotalWidths = {
	computedWidth: number;
	styleWidth: number;
};

export type GridColWidths = {
	width: number;
	colIndex: number;
};

export type GridColumns = {
	gridTemplateColumns?: string;
	totalWidths?: TotalWidths[];
	gridColWidths?: GridColWidths[];
};

export type StickyHeaderStyleState = {
	tableMarginTop: number;
	top: number;
	width: number;
};

export type StickyTableStyleOptions = {
	bgColor?: string;
	clientWidth?: number;
	enableStickyCol: boolean;
	enableStickyRow: boolean;
	firstColumnWidth?: number;
	gridColumns: GridColumns;
};

type UseStickyTableStylesParams = StickyTableStyleOptions & {
	headerRowRef?: MutableRefObject<HTMLTableRowElement>;
	stickyTableWrapperRef: MutableRefObject<HTMLDivElement>;
	tableRef: RefObject<HTMLTableElement>;
	topShadowContainerRef: MutableRefObject<HTMLDivElement>;
};

type StickyVariableName = (typeof STICKY_VARIABLES)[keyof typeof STICKY_VARIABLES];

const BASE_VARIABLES = [
	STICKY_VARIABLES.bgColor,
	STICKY_VARIABLES.clientWidth,
	STICKY_VARIABLES.controlsVerticalTop,
	STICKY_VARIABLES.firstColumnWidth,
	STICKY_VARIABLES.gridTemplateColumns,
	STICKY_VARIABLES.helpersLeft,
	STICKY_VARIABLES.leftShadowHeight,
	STICKY_VARIABLES.leftShadowLeft,
	STICKY_VARIABLES.negativeSidePadding,
	STICKY_VARIABLES.scrollShadowSize,
	STICKY_VARIABLES.sidePadding,
	STICKY_VARIABLES.topPadding,
	STICKY_VARIABLES.verticalTopOffset,
];

const ROW_VARIABLES = [
	STICKY_VARIABLES.firstVerticalPlusDivTop,
	STICKY_VARIABLES.firstVerticalPlusIconTop,
	STICKY_VARIABLES.headerTop,
	STICKY_VARIABLES.headerWidth,
	STICKY_VARIABLES.helpersTop,
	STICKY_VARIABLES.secondVerticalPlusDivTop,
	STICKY_VARIABLES.tableMarginTop,
	STICKY_VARIABLES.topShadowTop,
];

const px = (value: number | undefined) => (value === undefined ? undefined : `${value}px`);

const setWrapperVariables = (
	wrapper: HTMLElement,
	variables: Partial<Record<StickyVariableName, string | undefined>>,
) => {
	Object.entries(variables).forEach(([name, value]) => {
		if (value === undefined) {
			wrapper.style.removeProperty(name);
			return;
		}

		if (wrapper.style.getPropertyValue(name) !== value) {
			wrapper.style.setProperty(name, value);
		}
	});
};

const removeWrapperVariables = (wrapper: HTMLElement, variables: readonly StickyVariableName[]) => {
	variables.forEach((name) => wrapper.style.removeProperty(name));
};

const useStickyTableStyles = (params: UseStickyTableStylesParams) => {
	const { stickyTableWrapperRef } = params;
	const paramsRef = useRef(params);
	paramsRef.current = params;

	const applyBaseVariables = useCallback(() => {
		const wrapper = stickyTableWrapperRef.current;
		if (!wrapper) return;

		const { bgColor, clientWidth, firstColumnWidth, gridColumns } = paramsRef.current;

		setWrapperVariables(wrapper, {
			[STICKY_VARIABLES.bgColor]: bgColor,
			[STICKY_VARIABLES.clientWidth]: px(clientWidth),
			[STICKY_VARIABLES.controlsVerticalTop]: CONTROLS_CONTAINER_VERTICAL_TOP,
			[STICKY_VARIABLES.firstColumnWidth]: px(firstColumnWidth),
			[STICKY_VARIABLES.gridTemplateColumns]: gridColumns.gridTemplateColumns,
			[STICKY_VARIABLES.helpersLeft]: HELPERS_LEFT,
			[STICKY_VARIABLES.leftShadowHeight]: `calc(100% - ${PADDING_TOP_BOTTOM} - ${VERTICAL_TOP_OFFSET})`,
			[STICKY_VARIABLES.leftShadowLeft]:
				firstColumnWidth === undefined ? undefined : `calc(${firstColumnWidth}px + ${PADDING_LEFT_RIGHT})`,
			[STICKY_VARIABLES.negativeSidePadding]: `-${PADDING_LEFT_RIGHT}`,
			[STICKY_VARIABLES.scrollShadowSize]: SCROLL_SHADOW_SIZE,
			[STICKY_VARIABLES.sidePadding]: PADDING_LEFT_RIGHT,
			[STICKY_VARIABLES.topPadding]: `${TOP_PADDING}px`,
			[STICKY_VARIABLES.verticalTopOffset]: VERTICAL_TOP_OFFSET,
		});

		if (paramsRef.current.enableStickyCol) {
			wrapper.setAttribute(COL_ACTIVE_ATTRIBUTE, "true");
			return;
		}

		wrapper.removeAttribute(COL_ACTIVE_ATTRIBUTE);
	}, [stickyTableWrapperRef]);

	const applyStickyHeaderStyles = useCallback(
		(state: StickyHeaderStyleState) => {
			const wrapper = stickyTableWrapperRef.current;
			if (!wrapper || !paramsRef.current.enableStickyRow) return;

			applyBaseVariables();
			wrapper.setAttribute(ROW_ACTIVE_ATTRIBUTE, "true");
			setWrapperVariables(wrapper, {
				[STICKY_VARIABLES.firstVerticalPlusDivTop]: `calc(${CONTROLS_CONTAINER_VERTICAL_TOP} - ${VERTICAL_TOP_OFFSET} + ${
					state.top
				}px)`,
				[STICKY_VARIABLES.firstVerticalPlusIconTop]: `calc(${CONTROLS_CONTAINER_VERTICAL_TOP} + ${
					state.tableMarginTop / 2 + state.top
				}px)`,
				[STICKY_VARIABLES.headerTop]: `${state.top}px`,
				[STICKY_VARIABLES.headerWidth]: `${state.width}px`,
				[STICKY_VARIABLES.helpersTop]: `calc(${HELPERS_TOP} + ${state.top}px)`,
				[STICKY_VARIABLES.secondVerticalPlusDivTop]: `calc(${CONTROLS_CONTAINER_VERTICAL_TOP} - ${VERTICAL_TOP_OFFSET} + ${
					state.tableMarginTop + state.top
				}px)`,
				[STICKY_VARIABLES.tableMarginTop]: `${state.tableMarginTop}px`,
				[STICKY_VARIABLES.topShadowTop]: `${state.top + state.tableMarginTop + TOP_PADDING}px`,
			});
		},
		[applyBaseVariables, stickyTableWrapperRef],
	);

	const resetStickyHeaderStyles = useCallback(() => {
		const wrapper = stickyTableWrapperRef.current;
		if (!wrapper) return;

		wrapper.removeAttribute(ROW_ACTIVE_ATTRIBUTE);
		removeWrapperVariables(wrapper, ROW_VARIABLES);
	}, [stickyTableWrapperRef]);

	useEffect(() => {
		applyBaseVariables();
	});

	useEffect(() => {
		const wrapper = stickyTableWrapperRef.current;

		return () => {
			if (!wrapper) return;
			wrapper.removeAttribute(ROW_ACTIVE_ATTRIBUTE);
			wrapper.removeAttribute(COL_ACTIVE_ATTRIBUTE);
			removeWrapperVariables(wrapper, BASE_VARIABLES);
			removeWrapperVariables(wrapper, ROW_VARIABLES);
		};
	}, [stickyTableWrapperRef]);

	return {
		applyStickyHeaderStyles,
		resetStickyHeaderStyles,
	};
};

export default useStickyTableStyles;
