import Paginator from "@ext/print/utils/pagination/Paginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { RowPaginator } from "@ext/markdown/elements/table/print/RowPaginator";
import { RowGroupPaginator } from "@ext/markdown/elements/table/print/RowGroupPaginator";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import type { TablePaginatorInterface } from "@ext/markdown/elements/table/print/TablePaginator.types";

export class TablePaginator
	extends NodePaginator<HTMLDivElement, HTMLTableSectionElement>
	implements TablePaginatorInterface
{
	private currentTableWrapper: HTMLDivElement;
	private repeatThead: HTMLTableSectionElement;
	private table: HTMLDivElement;
	private _rowIndex: number;

	constructor(tableWrapper: HTMLDivElement, parentPaginator: Paginator) {
		super(tableWrapper, parentPaginator);
		this.table = this.node.firstElementChild as HTMLDivElement;
		this.repeatThead = this.getRepeatableThead();
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const allRows = this.collectBodyRows();

		const { table, tbody } = this.cloneTableShell();

		this.currentTableWrapper = this.node.cloneNode(false) as HTMLDivElement;
		this.parentPaginator.currentContainer.appendChild(this.currentTableWrapper);
		this.currentTableWrapper.appendChild(table);
		this.currentContainer = tbody;
		this.addDimension();

		for (this._rowIndex = 0; this._rowIndex < allRows.length; this._rowIndex++) {
			const row = allRows[this._rowIndex];
			const rowHeight = Paginator.paginationInfo.nodeDimension.get(row).height;

			if (RowGroupPaginator.hasRowspanCells(row)) {
				const groupIndices = this.getRowspanGroupIndices(allRows, this._rowIndex);
				const groupHeight = this.getGroupHeight(allRows, groupIndices);
				const usableHeight = this.getUsableHeight();
				const accumulated = Paginator.paginationInfo.accumulatedHeight.height;

				if (groupHeight + accumulated > usableHeight) this.createPage();
				if (groupHeight <= usableHeight) {
					for (const index of groupIndices) {
						const groupRow = allRows[index];
						const groupRowHeight = Paginator.paginationInfo.nodeDimension.get(groupRow).height;
						Paginator.paginationInfo.accumulatedHeight.height += groupRowHeight;
						this.currentContainer.appendChild(groupRow);
					}
					this._rowIndex += groupIndices.length - 1;
					continue;
				}

				const groupRows = groupIndices.map((idx) => allRows[idx]);
				const groupPaginator = new RowGroupPaginator(groupRows, this);
				await groupPaginator.paginateNode();
				this._rowIndex += groupIndices.length - 1;
				continue;
			}

			if (rowHeight + Paginator.paginationInfo.accumulatedHeight.height > this.getUsableHeight()) {
				this.createPage();
				if (rowHeight > this.getUsableHeight()) {
					const rowPaginator = new RowPaginator(row, this);
					await rowPaginator.paginateNode();
					continue;
				}
			}
			Paginator.paginationInfo.accumulatedHeight.height += rowHeight;

			this.currentContainer.appendChild(row);
		}

		this.setMarginBottom();
		this.node.remove();
	}

	createPage() {
		if (this.currentContainer.childNodes.length) {
			const { table, tbody } = this.cloneTableShell();
			this.currentContainer = tbody;
			this.currentTableWrapper = this.node.cloneNode(false) as HTMLDivElement;
			this.currentTableWrapper.appendChild(table);
		} else this.currentTableWrapper.remove();

		const parentPage = this.parentPaginator.createPage();
		parentPage.appendChild(this.currentTableWrapper);

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	addDimension() {
		const theadHeight = this.getTheadHeight();
		const addDimension = { ...this.nodeDimension };
		addDimension.height = theadHeight + addDimension.paddingH;
		this.updateAccumulatedHeightDim(addDimension);
	}

	private getTheadHeight() {
		return parseFloat(this.repeatThead?.dataset._height || "0");
	}

	private cloneTableShell(withOutTableHeader?: boolean) {
		const newTable = this.table.cloneNode(false) as HTMLDivElement;
		for (const attr of Array.from(this.table.attributes)) newTable.setAttribute(attr.name, attr.value);

		const colgroup = this.table.querySelector("colgroup");
		if (colgroup) newTable.appendChild(colgroup.cloneNode(true));

		if (this.repeatThead && !withOutTableHeader) newTable.appendChild(this.repeatThead.cloneNode(true));

		const tbody = document.createElement("tbody");
		newTable.appendChild(tbody);
		return { table: newTable, tbody };
	}

	private getRepeatableThead() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const thead = this.table.querySelector("thead");
		if (thead) return thead.cloneNode(true) as HTMLTableSectionElement;

		const headerAttr = (this.table.getAttribute("data-header") || "").toLowerCase().trim();

		if (headerAttr === "column") {
			return null;
		}

		if (headerAttr === "row" || headerAttr === "both") {
			const firstBodyRow = this.table.querySelector<HTMLTableRowElement>("tbody tr");
			const isSimpleRow = Array.from(firstBodyRow.cells).every((cell) => !cell.rowSpan || cell.rowSpan === 1);

			if (firstBodyRow && isSimpleRow) {
				const newThead = document.createElement("thead");
				newThead.appendChild(firstBodyRow.cloneNode(true));
				newThead.dataset._synthesized = "from-first-row";
				newThead.dataset._height = `${nodeDimension?.get(firstBodyRow).height}`;
				return newThead;
			}
		}

		let headerRow = this.table.querySelector("tbody tr.repeat-header, tbody tr[data-repeat-header]");

		if (!headerRow) {
			const firstBodyRow = this.table.querySelector<HTMLTableRowElement>("tbody tr");

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
	}

	private collectBodyRows() {
		const rows: HTMLTableRowElement[] = [];

		const headerRowFromFirst =
			this.repeatThead &&
			(this.repeatThead.dataset._synthesized === "from-first-row" ||
				this.repeatThead.dataset._synthesized === "1")
				? this.repeatThead.querySelector("tr")
				: null;

		let skippedFirst = false;
		this.node.querySelectorAll("tbody").forEach((tb) => {
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
	}
	private getRowspanGroupIndices(allRows: HTMLTableRowElement[], startIndex: number): number[] {
		const groupIndices = new Set<number>();
		const processedRows = new Set<number>();

		const collectGroup = (rowIndex: number) => {
			if (processedRows.has(rowIndex) || rowIndex >= allRows.length) return;
			processedRows.add(rowIndex);
			groupIndices.add(rowIndex);

			const row = allRows[rowIndex];

			for (const cell of row.cells) {
				if (cell.rowSpan > 1) {
					const endIndex = rowIndex + cell.rowSpan - 1;
					for (let i = rowIndex + 1; i <= endIndex && i < allRows.length; i++) {
						if (!processedRows.has(i)) {
							collectGroup(i);
						}
					}
				}
			}
		};

		collectGroup(startIndex);
		return Array.from(groupIndices).sort((a, b) => a - b);
	}

	private getGroupHeight(allRows: HTMLTableRowElement[], groupIndices: number[]): number {
		let totalHeight = 0;
		for (const index of groupIndices) {
			totalHeight += Paginator.paginationInfo.nodeDimension.get(allRows[index]).height;
		}
		return totalHeight;
	}
}
