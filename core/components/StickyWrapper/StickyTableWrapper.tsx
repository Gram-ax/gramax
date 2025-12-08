import React, { useMemo, useRef } from "react";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import WidthWrapper, { WidthWrapperProps } from "@components/WidthWrapper/WidthWrapper";
import useStickyTableHeader, {
	StickyTableHeaderState,
	TOP_PADDING,
} from "@components/StickyWrapper/hooks/useStickyTableHeader";
import { PADDING_LEFT_RIGHT, PADDING_TOP_BOTTOM } from "@ext/markdown/elements/table/render/component/TableWrapper";
import {
	HELPERS_LEFT,
	HELPERS_TOP,
	CONTROLS_CONTAINER_VERTICAL_TOP,
	VERTICAL_TOP_OFFSET,
} from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import ThemeService from "@ext/Theme/components/ThemeService";

export interface StickyWrapperProps {
	styckyStyles: StickyTableHeaderState;
	firstColumnWidth?: string;
	clientWidth?: number;
	bgColor?: string;
	gridTemplateColumns?: string;
	stickyColumnCSS?: string;
	colWidths?: {
		styleWidth: number;
		computedWidth: string;
	}[];
	firstRowCellsWidths?: string[];
}

const SCROLL_SHADOW_SIZE = "1.25rem";

const StickyWrapper = styled.div<StickyWrapperProps>`
	${({ styckyStyles, bgColor, gridTemplateColumns, colWidths, firstRowCellsWidths, clientWidth }) => {
		if (!styckyStyles.tableStyles.tableMarginTop) return;
		return css`
			> .width-wrapper > .scrollableContent > div[data-table-wrapper] > {
				table[data-header="row"],
				table[data-header="both"] {
					margin-top: ${styckyStyles.tableStyles.tableMarginTop}px;

					> tbody > tr:first-of-type {
						${css({
							...styckyStyles.headerRowStyles,
						})}

						position: fixed;
						overflow-x: scroll;
						&::-webkit-scrollbar {
							display: none;
						}
						scrollbar-width: none;

						display: grid;
						grid-template-columns: ${gridTemplateColumns};
						z-index: 2;
						background-color: ${bgColor};
						padding: 0 calc(${PADDING_LEFT_RIGHT} + 0.5px);

						margin-left: -${PADDING_LEFT_RIGHT};

						> td:first-of-type {
							left: -0.5px !important;
							width: calc(100% + 0.5px);
							box-shadow: -0.67px 0 0 0 var(--color-table-border);
						}

						> td {
							border-left: none;
						}

						${colWidths.map(({ computedWidth, styleWidth }, i) => {
							if (styleWidth) return;
							return css`
								> td:nth-of-type(${i + 1}) {
									min-width: ${computedWidth};
								}
							`;
						})}
					}

					> colgroup {
						${colWidths.map(({ styleWidth }, i) => {
							if (styleWidth) return;
							return css`
								> col:nth-of-type(${i + 1}) {
									min-width: ${firstRowCellsWidths[i]};
								}
							`;
						})}
					}
				}
				table[data-header="both"] > tbody > tr:first-of-type {
					padding: 0 calc(${PADDING_LEFT_RIGHT});
					> td:first-of-type {
						left: 0 !important;
						width: calc(100%);
					}
				}
			}
			> .width-wrapper .controls-container-horizontal {
				position: fixed;
				left: unset;
				padding-left: ${PADDING_LEFT_RIGHT};
				top: calc(${HELPERS_TOP} + ${styckyStyles.headerRowStyles.top - TOP_PADDING}px);
			}

			> .width-wrapper:has(> .scrollableContent > div[data-table-wrapper] > table[data-header="both"]),
			> .width-wrapper:has(> .scrollableContent > div[data-table-wrapper] > table[data-header="row"]) {
				> .top-block {
					position: fixed;
					width: ${styckyStyles.headerRowStyles.width}px;
					height: ${PADDING_TOP_BOTTOM};
					background: ${bgColor};
					top: ${styckyStyles.headerRowStyles.top - TOP_PADDING}px;
					z-index: 2;
				}

				.controls-container-horizontal {
					position: fixed;
					left: unset;
					padding-left: ${PADDING_LEFT_RIGHT};
					top: calc(${HELPERS_TOP} + ${styckyStyles.headerRowStyles.top - TOP_PADDING}px);
				}
				> .scrollableContent > div[data-table-select-all-container] {
					position: fixed;

					top: calc(${HELPERS_TOP} + ${styckyStyles.headerRowStyles.top - TOP_PADDING}px);
					left: unset;
					padding-left: ${HELPERS_LEFT};
					z-index: 3;
				}
				> .scrollableContent {
					> .top-shadow-container {
						position: fixed;
						pointer-events: none;
						height: ${SCROLL_SHADOW_SIZE};
						top: ${styckyStyles.headerRowStyles.top + styckyStyles.tableStyles.tableMarginTop}px;
						z-index: 2;
						width: ${styckyStyles.headerRowStyles.width}px;
						overflow: hidden;
						padding: 0 1.5em;

						> .top-shadow {
							height: 100%;
							width: calc(${clientWidth}px - ${PADDING_LEFT_RIGHT} - ${PADDING_LEFT_RIGHT});
							width: ${clientWidth}px;
						}
					}
					> .table-actions {
						z-index: 3;
					}
					> .table-actions > .table-controller > .controls-container-horizontal {
						width: ${styckyStyles.headerRowStyles.width}px;
						overflow-x: hidden;
						overflow-y: hidden;
						pointer-events: none;
						justify-content: unset;
						height: ${styckyStyles.tableStyles.bottom}px;

						> .plus-actions-container.plus-actions-container:first-of-type,
						> .plus-actions-container.plus-actions-container[data-col-number="0"] {
							left: 0em;
						}
					}
				}
			}
			> .width-wrapper:has(> .scrollableContent > div[data-table-wrapper] > table[data-header="both"]) {
				> .scrollableContent > .table-actions > .table-controller > .controls-container-vertical {
					> .plus-actions-container.plus-actions-container:first-of-type {
						> div {
							position: fixed;
							top: calc(
								${CONTROLS_CONTAINER_VERTICAL_TOP} - ${VERTICAL_TOP_OFFSET} +
									${styckyStyles.headerRowStyles.top - TOP_PADDING}px
							);
							left: unset;
							margin-left: ${HELPERS_LEFT};
						}
						> i {
							position: fixed;
							top: calc(
								${CONTROLS_CONTAINER_VERTICAL_TOP} +
									${styckyStyles.tableStyles.tableMarginTop / 2 +
									styckyStyles.headerRowStyles.top -
									TOP_PADDING}px
							);
							left: unset;
							margin-left: ${HELPERS_LEFT};
						}
					}
					>.plus-actions-container.plus-actions-container: nth-of-type(2) {
						> div {
							position: fixed;
							top: calc(
								${CONTROLS_CONTAINER_VERTICAL_TOP} - ${VERTICAL_TOP_OFFSET} +
									${styckyStyles.tableStyles.tableMarginTop +
									styckyStyles.headerRowStyles.top -
									TOP_PADDING}px
							);
							left: unset;
							margin-left: ${HELPERS_LEFT};
						}
					}
				}
			}
		`;
	}}
	${({ stickyColumnCSS, firstColumnWidth, bgColor, clientWidth }) =>
		stickyColumnCSS &&
		css`
			> .width-wrapper > .scrollableContent > div[data-table-wrapper] > {
				table[data-header="column"] tbody,
				table[data-header="both"] tbody {
					${stickyColumnCSS}
					> tr > td:nth-of-type(2) {
						border-left: none;
					}
				}

				table[data-header="column"] tbody tr,
				table[data-header="both"] tbody tr {
					:has(> td:hover) {
						> td:first-of-type {
							background-color: var(--color-table-row-hover) !important;
						}
					}
				}
			}
			> .width-wrapper:has(> .scrollableContent > div[data-table-wrapper] > table[data-header="both"]):has(
					> .shadow-box.left
				),
			> .width-wrapper:has(> .scrollableContent > div[data-table-wrapper] > table[data-header="column"]):has(
					> .shadow-box.left
				) {
				> .scrollableContent {
					> .left-shadow-container {
						pointer-events: none;
						user-select: none;
						position: absolute;
						width: ${clientWidth}px;
						height: 100%;
						top: 0;
					}
					> .left-shadow-container > .left-shadow {
						pointer-events: none;
						user-select: none;
						width: ${SCROLL_SHADOW_SIZE};
						position: sticky;
						height: calc(100% - ${PADDING_TOP_BOTTOM} - ${VERTICAL_TOP_OFFSET});
						left: calc(${firstColumnWidth} + ${PADDING_LEFT_RIGHT});
						z-index: 2;
						margin-top: 1.25em;
					}
				}
			}
			> .width-wrapper:has(> .scrollableContent > div[data-table-wrapper] > table[data-header="both"]),
			> .width-wrapper:has(> .scrollableContent > div[data-table-wrapper] > table[data-header="column"]) {
				> .shadow-box.left {
					width: ${PADDING_LEFT_RIGHT} !important;
					background-color: ${bgColor} !important;
				}

				> .scrollableContent {
					> .table-actions {
						z-index: 3;
						width: ${clientWidth}px;

						> .table-controller {
							height: 0;
							width: 100%;

							.controls-container-vertical {
								width: fit-content;
								position: sticky;
								padding-top: ${CONTROLS_CONTAINER_VERTICAL_TOP};
							}

							> .controls-container-horizontal {
								> .plus-actions-container:first-of-type,
								> .plus-actions-container[data-col-number="0"] {
									position: sticky;
									left: ${PADDING_LEFT_RIGHT};
								}
							}
						}
					}
					> div[data-table-select-all-container] {
						width: ${clientWidth}px;
						> div[data-qa="table-select-all"] {
							left: ${HELPERS_LEFT};
							position: sticky;
							width: 0;
						}
					}
				}
			}
		`}
`;

const getEffectiveBackgroundColor = (element: HTMLElement | null): string => {
	let el = element;
	while (el) {
		const bg = window.getComputedStyle(el).backgroundColor;
		if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
			return bg;
		}
		el = el.parentElement;
	}
	return "rgba(0, 0, 0, 0)";
};

const hasRowspanInFirstRow = (table: HTMLTableElement | null): boolean => {
	if (!table) return false;
	const firstRow = table.querySelector("tbody > tr:first-of-type");
	if (!firstRow) return false;
	const cells = Array.from(firstRow.children) as HTMLTableCellElement[];
	return cells.some((cell) => Number(cell.getAttribute("rowspan")) > 1);
};

const hasColspanInFirstCol = (table: HTMLTableElement | null): boolean => {
	if (!table) return false;
	const rows = table.querySelectorAll("tbody > tr");
	for (const row of Array.from(rows)) {
		const cell = row.querySelector("td, th");
		if (cell && Number(cell.getAttribute("colspan")) > 1) {
			return true;
		}
	}
	return false;
};

const getFirstColumnCells = (table: HTMLTableElement | null): HTMLTableCellElement[] => {
	if (!table) return [];

	const cells: HTMLTableCellElement[] = [];
	const rows = table.querySelectorAll("tbody > tr");
	const numCols = Math.max(...Array.from(rows).map((row) => row.children.length));
	const rowspanLeft = new Array(numCols).fill(0);

	rows.forEach((row) => {
		const rowCells = Array.from(row.children) as HTMLTableCellElement[];
		let currentCol = 0;

		for (const cell of rowCells) {
			while (currentCol < numCols && rowspanLeft[currentCol] > 0) {
				rowspanLeft[currentCol]--;
				currentCol++;
			}

			if (currentCol >= numCols) break;

			const colspan = Number(cell.getAttribute("colspan")) || 1;
			const rowspan = Number(cell.getAttribute("rowspan")) || 1;

			if (currentCol === 0) {
				cells.push(cell);
			}

			for (let i = 0; i < colspan; i++) {
				if (currentCol + i < numCols) {
					rowspanLeft[currentCol + i] = rowspan - 1;
				}
			}

			currentCol += colspan;
		}
	});

	return cells;
};

const StickyTableWrapper = (props: WidthWrapperProps) => {
	const { tableRef } = props;
	const theme = ThemeService.value;
	const bgColor = useMemo(() => getEffectiveBackgroundColor(tableRef.current), [tableRef.current, theme]);
	const stickyTableWrapperRef = useRef<HTMLDivElement>(null);
	const topShadowContainerRef = useRef<HTMLDivElement>(null);

	const clientWidth = tableRef.current?.clientWidth;

	const hasRowspan = hasRowspanInFirstRow(tableRef?.current);
	const hasColspan = hasColspanInFirstCol(tableRef?.current);

	const cols =
		!hasRowspan || !hasColspan
			? tableRef?.current?.querySelectorAll<HTMLTableColElement>("colgroup > col") || []
			: [];
	const rows = tableRef?.current?.querySelectorAll<HTMLTableRowElement>("tbody > tr");

	const enableStickyRow = !hasRowspan && rows?.length !== 1;
	const colWidths = [...cols].map((c) => {
		return {
			styleWidth: parseFloat(c.style.width),
			computedWidth: window.getComputedStyle(c).width,
		};
	});

	const emptyColWidth = colWidths.some((colWidth) => !colWidth.styleWidth);
	const firstRowCells = emptyColWidth ? rows?.[0]?.querySelectorAll<HTMLTableColElement>("td, th") || [] : [];
	const firstRowCellsWidths = [...firstRowCells].map((c) => window.getComputedStyle(c).width);

	const gridTemplateColumns = useMemo(
		() => colWidths.map((colWidth) => (colWidth.styleWidth ? `${colWidth.styleWidth}px` : `max-content`)).join(" "),
		[clientWidth, enableStickyRow],
	);
	const emptyRef = useRef();
	const styckyStyles = useStickyTableHeader(
		enableStickyRow ? tableRef : emptyRef,
		stickyTableWrapperRef,
		topShadowContainerRef,
	);
	const firstColumnCells = !hasColspan ? getFirstColumnCells(tableRef?.current) : [];

	const stickyColumnCSS = useMemo(() => {
		if (!tableRef.current || !firstColumnCells.length) return "";

		const selectors = firstColumnCells
			.map((cell) => {
				const rowIndex = Array.from(cell.parentElement.parentElement.children).indexOf(cell.parentElement) + 1;
				return `tr:nth-of-type(${rowIndex}) td:first-of-type`;
			})
			.join(",\n");

		return css`
			${selectors} {
				position: sticky;
				left: ${PADDING_LEFT_RIGHT};
				background-color: ${bgColor};
				z-index: 1;
				border-left: none;
				border-right: none;
				box-shadow: inset 0.67px 0 0 var(--color-table-border), inset -0.67px 0 0 var(--color-table-border);
			}
		`.styles;
	}, [firstColumnCells, bgColor, tableRef.current]);

	const children = (
		<>
			{props.children}
			<div className="top-shadow-container" ref={topShadowContainerRef}>
				<div className="top-shadow to-transparent bg-gradient-to-b from-shadow-scroll opacity-5" />
			</div>
			<div className="left-shadow-container">
				<div className="left-shadow to-transparent bg-gradient-to-r from-shadow-scroll opacity-5" />
			</div>
		</>
	);
	return (
		<StickyWrapper
			ref={stickyTableWrapperRef}
			data-sticky-wrapper=""
			styckyStyles={styckyStyles}
			firstColumnWidth={colWidths?.[0]?.computedWidth}
			bgColor={bgColor}
			clientWidth={clientWidth}
			gridTemplateColumns={gridTemplateColumns}
			stickyColumnCSS={stickyColumnCSS}
			colWidths={colWidths}
			firstRowCellsWidths={firstRowCellsWidths}
		>
			<WidthWrapper
				{...props}
				children={children}
				additional={
					styckyStyles.tableStyles.tableMarginTop ? (
						<>
							<div className="top-block" />
						</>
					) : null
				}
			/>
		</StickyWrapper>
	);
};

export default StickyTableWrapper;
