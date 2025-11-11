import { HEIGHT_TOLERANCE_PX } from "@ext/print/const";
import { throwIfAborted } from "../../../../print/utils/pagination/abort";
import { createPage, getUsableHeight, getUsableWidth } from "../../../../print/utils/pagination/pageElements";
import { ProgressTracker } from "../../../../print/utils/pagination/progress";
import { PaginationState } from "@ext/print/utils/pagination/nodeHandlers";
import { NodeDimensions } from "@ext/print/utils/pagination/NodeDimensions";

const getColWidths = (firstRow: HTMLTableRowElement, pageWidth: number) => {
	const cells = Array.from(firstRow.children) as HTMLTableCellElement[];

	let totalKnownWidth = 0;
	let unknownCount = 0;
	const widths: number[] = [];

	let colsCount = 0;

	cells.forEach((cell) => {
		const colWidth = cell.getAttribute("colwidth");
		const colspan = parseInt(cell.getAttribute("colspan")) || 1;
		if (colWidth) {
			totalKnownWidth += parseFloat(colWidth);
			widths.push(parseInt(colWidth));
		} else {
			widths.push(0);
			unknownCount += colspan;
		}
		colsCount += colspan;
	});

	const defaultColwidth = pageWidth / colsCount;
	const remainingWidth = pageWidth - defaultColwidth * unknownCount;
	const coefficient = totalKnownWidth <= remainingWidth ? 1 : remainingWidth / totalKnownWidth;

	return widths.map((width) => {
		if (!width) return defaultColwidth;
		return width * coefficient;
	});
};

const getRepeatableColgroup = (srcTable: HTMLTableElement, pageWidth: number): HTMLTableColElement | null => {
	const colgroup = srcTable.querySelector("colgroup");

	if (colgroup) return colgroup.cloneNode(true) as HTMLTableColElement;

	const firstRow = srcTable.querySelector<HTMLTableRowElement>("tbody tr");
	const newColgroup = document.createElement("colgroup");

	const colWidths = getColWidths(firstRow, pageWidth);
	colWidths.forEach((colWidth) => {
		const col = document.createElement("col");
		col.style.width = `${colWidth}px`;
		col.style.minWidth = `${colWidth}px`;
		newColgroup.appendChild(col);
	});
	return newColgroup;
};

export const getRepeatableThead = (
	srcTable: HTMLTableElement,
	nodeDimension?: NodeDimensions,
): HTMLTableSectionElement | null => {
	const thead = srcTable.querySelector("thead");
	if (thead) return thead.cloneNode(true) as HTMLTableSectionElement;

	const headerAttr = (srcTable.getAttribute("data-header") || "").toLowerCase().trim();

	if (headerAttr === "column") {
		return null;
	}

	if (headerAttr === "row" || headerAttr === "both") {
		const firstBodyRow = srcTable.querySelector("tbody tr");
		if (firstBodyRow) {
			const newThead = document.createElement("thead");
			newThead.appendChild(firstBodyRow.cloneNode(true));
			newThead.dataset._synthesized = "from-first-row";
			newThead.dataset._height = `${nodeDimension?.get(firstBodyRow as HTMLTableRowElement).height}`;
			return newThead;
		}
	}

	let headerRow = srcTable.querySelector("tbody tr.repeat-header, tbody tr[data-repeat-header]");

	if (!headerRow) {
		const firstBodyRow = srcTable.querySelector("tbody tr");
		if (firstBodyRow) {
			const allTh = Array.from(firstBodyRow.children).every((c) => c.tagName === "TH");
			if (allTh) headerRow = firstBodyRow;
		}
	}

	if (!headerRow) return null;
	const newThead = document.createElement("thead");
	newThead.dataset._synthesized = "1";
	newThead.appendChild(headerRow.cloneNode(true));
	newThead.dataset._height = `${nodeDimension?.get(headerRow as HTMLTableRowElement).height}`;
	return newThead;
};

export const cloneTableShell = (
	srcTable: HTMLTableElement,
	repeatThead: HTMLTableSectionElement | null,
	repeatColgroup: HTMLTableColElement | null,
): { table: HTMLTableElement; tbody: HTMLTableSectionElement } => {
	const newTable = srcTable.cloneNode(false) as HTMLTableElement;
	for (const attr of Array.from(srcTable.attributes)) newTable.setAttribute(attr.name, attr.value);

	// const colgroup = srcTable.querySelector("colgroup");
	// if (colgroup) newTable.appendChild(colgroup.cloneNode(true));

	if (repeatColgroup) newTable.appendChild(repeatColgroup.cloneNode(true));
	if (repeatThead) newTable.appendChild(repeatThead.cloneNode(true));

	const tbody = document.createElement("tbody");
	newTable.appendChild(tbody);
	return { table: newTable, tbody };
};

export const collectBodyRows = (
	srcTable: HTMLTableElement,
	synthesizedThead: HTMLTableSectionElement | null,
): HTMLTableRowElement[] => {
	const rows: HTMLTableRowElement[] = [];

	const headerRowFromFirst =
		synthesizedThead &&
		(synthesizedThead.dataset._synthesized === "from-first-row" || synthesizedThead.dataset._synthesized === "1")
			? synthesizedThead.querySelector("tr")
			: null;

	let skippedFirst = false;
	srcTable.querySelectorAll("tbody").forEach((tb) => {
		tb.querySelectorAll("tr").forEach((tr) => {
			if (headerRowFromFirst) {
				if (!skippedFirst) {
					skippedFirst = true;
					return;
				}
			}
			rows.push(tr);
		});
	});

	return rows;
};

export const countTopLevelTableRows = (source: HTMLElement, nodeDimension: NodeDimensions): number => {
	let total = 0;
	source.querySelectorAll(":scope > table").forEach((tableEl) => {
		const table = tableEl as HTMLTableElement;
		const repeatThead = getRepeatableThead(table, nodeDimension);
		total += collectBodyRows(table, repeatThead).length;
	});
	return total;
};

export type YieldFn = (force?: boolean) => Promise<void>;
export const paginateTable = async (
	pages: HTMLElement,
	srcTable: HTMLTableElement,
	state: PaginationState,
	nodeDimension: NodeDimensions,
	yieldTick: YieldFn,
	progress: ProgressTracker,
	signal?: AbortSignal,
): Promise<HTMLElement> => {
	const { currentPage } = state;
	throwIfAborted(signal);
	let page = currentPage;
	const repeatThead = getRepeatableThead(srcTable, nodeDimension);
	const maxWidth = getUsableWidth(page);
	const maxHeight = getUsableHeight(page) + HEIGHT_TOLERANCE_PX;
	const repeatColgroup = getRepeatableColgroup(srcTable, maxWidth);
	const allRows = collectBodyRows(srcTable, repeatThead);
	const tableDimension = nodeDimension.get(srcTable);

	let { table, tbody } = cloneTableShell(srcTable, repeatThead, repeatColgroup);
	page.appendChild(table);

	let accumulatedHeight =
		state.accumulatedHeight.height + Math.max(state.accumulatedHeight.marginBottom, tableDimension.marginTop);
	let fragment = state.fragment;
	const baseTableHeight =
		tableDimension.paddingTop + tableDimension.paddingBottom + parseFloat(repeatThead?.dataset._height || "0");
	let fragmentHeight = baseTableHeight;

	for (let i = 0; i < allRows.length; i++) {
		throwIfAborted(signal);
		const row = allRows[i];
		const rowHeight = nodeDimension.get(row).height ?? 0;

		if (accumulatedHeight + fragmentHeight + rowHeight > maxHeight) {
			fragmentHeight === baseTableHeight ? table.remove() : tbody.appendChild(fragment);

			({ table, tbody } = cloneTableShell(srcTable, repeatThead, repeatColgroup));
			page = createPage(pages);

			page.appendChild(table);
			accumulatedHeight = 0;

			fragment = document.createDocumentFragment();
			fragmentHeight = baseTableHeight;

			await yieldTick();
			throwIfAborted(signal);
		}

		fragment.appendChild(row);
		fragmentHeight += rowHeight;
		progress.increase();
	}
	if (fragment.childNodes.length) {
		tbody.appendChild(fragment);
		const fromOldPage = accumulatedHeight ? state.accumulatedHeight.height : 0;
		state.accumulatedHeight.height = fromOldPage + fragmentHeight;
		state.accumulatedHeight.marginBottom = tableDimension.marginBottom;
	}

	srcTable.remove();
	return page;
};
