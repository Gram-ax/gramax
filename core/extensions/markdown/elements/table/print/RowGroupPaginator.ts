import { RowPaginator } from "@ext/markdown/elements/table/print/RowPaginator";
import type { TablePaginatorInterface } from "@ext/markdown/elements/table/print/TablePaginator.types";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

export class RowGroupPaginator extends NodePaginator<HTMLElement, HTMLTableSectionElement> {
	private _rows: HTMLTableRowElement[];
	private _containers: { container: HTMLTableSectionElement; rowIndex: number }[] = [];
	private _emptyAccumulatedHeight: number;
	private _rowIndex: number;
	private _containerIndex: number = 0;
	private _nextContainersCells = new Map<number, HTMLTableCellElement[]>();
	private _cellsWithRowSpan = new Map<number, { rowSpan: number; rowIndex: number; cell: HTMLTableCellElement }>();

	constructor(rows: HTMLTableRowElement[], parentPaginator: TablePaginatorInterface) {
		const fakeTbody = document.createDocumentFragment();
		for (const r of rows) fakeTbody.appendChild(r);

		super(fakeTbody as any, parentPaginator);
		this._rows = rows;
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);
		this._containers.push({
			container: this.parentPaginator.currentContainer as HTMLTableSectionElement,
			rowIndex: 0,
		});

		for (this._rowIndex = 0; this._rowIndex < this._rows.length; this._rowIndex++) {
			const row = this._rows[this._rowIndex];
			this._cleanNextContainerFirstRow();
			this._setIfRowSpan();

			this.currentContainer = this._containers[this._containerIndex].container;
			const rowHeight = Paginator.paginationInfo.nodeDimension.get(row).height;
			const hasRowspanCells = RowGroupPaginator.hasRowspanCells(row);
			const usableHeight = this.getUsableHeight();

			if (rowHeight + Paginator.paginationInfo.accumulatedHeight.height > usableHeight) {
				this.createPage();
			}

			if (hasRowspanCells) {
				this._checkCellsWithRowSpan();
				const cells = Array.from(row.cells);
				this._findCellsWithRowSpan(cells);

				const heightBefore = Paginator.paginationInfo.accumulatedHeight.height;
				const containerIndexBefore = this._containerIndex;

				const rowPaginator = new RowPaginator(row, this);
				await rowPaginator.paginateNode();
				const indexes = this.minRowspanCells(row);

				if (rowHeight + heightBefore < usableHeight) {
					this._containerIndex = containerIndexBefore;
					Paginator.paginationInfo.accumulatedHeight.height = heightBefore + rowHeight;
				} else {
					const c1 = rowPaginator.accumulated.filter((_, index) => indexes.includes(index));
					const maxRowIndex = c1.reduce((rowIndex, a) => {
						if (a.rows > rowIndex) return a.rows;
						return rowIndex;
					}, 0);
					const c2 = c1
						.filter((a) => (a.rows = maxRowIndex))
						.reduce((maxHeight, a) => {
							if (a.height > maxHeight) return a.height;
							return maxHeight;
						}, 0);
					this._containerIndex = containerIndexBefore + maxRowIndex - 1;
					Paginator.paginationInfo.accumulatedHeight.height = this._emptyAccumulatedHeight + c2;
				}

				rowPaginator.accumulated.reduce;

				continue;
			}

			if (rowHeight > usableHeight) {
				const rowPaginator = new RowPaginator(row, this);
				await rowPaginator.paginateNode();
				continue;
			}

			Paginator.paginationInfo.accumulatedHeight.height += rowHeight;
			this.currentContainer.appendChild(row);
		}

		this._setFirstRows();
	}

	createPage() {
		this._containerIndex++;
		this._setCellsWithRowSpan();
		const container = this._containers[this._containerIndex];

		if (!container) {
			this.currentContainer = (this.parentPaginator as TablePaginatorInterface).createPage();
			this._containers.push({ container: this.currentContainer, rowIndex: this._rowIndex });
			this._emptyAccumulatedHeight = Paginator.paginationInfo.accumulatedHeight.height;
		} else {
			this.currentContainer = container.container;
			container.rowIndex = this._rowIndex;
			Paginator.paginationInfo.accumulatedHeight.height = this._emptyAccumulatedHeight;
		}
		return this.currentContainer;
	}

	private _cleanNextContainerFirstRow() {
		for (let index = this._containerIndex; index < this._containers.length - 1; index++) {
			const nextContainerIndex = index + 1;
			const nextContainer = this._containers[nextContainerIndex].container;
			const row = nextContainer.firstChild;
			if (row) {
				if (!this._nextContainersCells.get(nextContainerIndex))
					this._nextContainersCells.set(nextContainerIndex, []);
				const nextContainerCells = this._nextContainersCells.get(nextContainerIndex);

				row.remove();
				const cells = Array.from(row.childNodes);
				const cellsWithRowSpanIndexes = Array.from(this._cellsWithRowSpan.entries())
					.filter(([, v]) => v.rowIndex === this._rowIndex - 1)
					.map(([key]) => key);
				for (let i = 0, j = 0; i < cells.length; i++) {
					const cell = cells[i] as HTMLTableCellElement;
					if (cell.rowSpan && cell.rowSpan > 1) {
						cell.dataset._rowIndex = (this._rowIndex - 1).toString();
						nextContainerCells[cellsWithRowSpanIndexes[j]] = cell;
						j++;
					}
				}
			}
		}
	}

	private _findCellsWithRowSpan(cells: HTMLTableCellElement[]) {
		for (let i = 0, currentCellsWithRowSpan = 0; i < cells.length; i++) {
			const cell = cells[i];
			if (!cell.rowSpan || cell.rowSpan === 1) continue;
			let cellsWithRowSpanIndex = -currentCellsWithRowSpan;
			for (let j = 0; j <= i; j++) {
				if (this._cellsWithRowSpan.get(j + cellsWithRowSpanIndex)) {
					cellsWithRowSpanIndex++;
					--j;
				}
			}
			this._cellsWithRowSpan.set(i + cellsWithRowSpanIndex, {
				rowSpan: cell.rowSpan,
				rowIndex: this._rowIndex,
				cell,
			});
			currentCellsWithRowSpan++;
		}
	}

	private _checkCellsWithRowSpan() {
		this._cellsWithRowSpan.forEach((c, i) => {
			if (c.rowIndex + c.rowSpan - 1 < this._rowIndex) this._cellsWithRowSpan.delete(i);
		});
	}

	private _setCellsWithRowSpan() {
		this._checkCellsWithRowSpan();
		this._cellsWithRowSpan.forEach((c, i) => {
			if (!this._nextContainersCells.get(this._containerIndex))
				this._nextContainersCells.set(this._containerIndex, []);

			const container = this._nextContainersCells.get(this._containerIndex);
			if (container[i]) return;
			if (c.rowIndex === this._rowIndex) return;

			container[i] = c.cell.cloneNode(false) as HTMLTableCellElement;
			container[i].rowSpan = c.rowSpan;
			container[i].dataset._rowIndex = c.rowIndex.toString();
		});
	}

	private _setFirstRows() {
		const containerIndex = this._containerIndex;
		for (let index = 0; index <= containerIndex; index++) {
			const nextContainerCells = this._nextContainersCells.get(index);
			if (!nextContainerCells) continue;
			const { container, rowIndex } = this._containers[index];
			const row = container.firstChild;
			row.remove();

			const cells = (Array.from(row.childNodes) as HTMLTableCellElement[]).reverse();
			for (let i = 0; cells.length; i++) {
				const cell = nextContainerCells[i];
				if (!cell) nextContainerCells[i] = cells.pop();
			}

			const rowTemplate = this._rows[0].cloneNode(false);
			container.insertBefore(rowTemplate, container.firstChild);
			nextContainerCells.forEach((cell) => {
				if (cell.dataset._rowIndex) cell.rowSpan -= rowIndex - parseFloat(cell.dataset._rowIndex);
				rowTemplate.appendChild(cell);
			});
		}
	}

	private _setIfRowSpan() {
		if (this._containerIndex < this._containers.length - 1) {
			const nextContainer = this._containers[this._containerIndex + 1].container;
			const nextContainersCells = this._nextContainersCells.get(this._containerIndex + 1);
			if (
				nextContainersCells?.some(
					(cell) => parseFloat(cell.dataset._rowIndex) + cell.rowSpan === this._rowIndex - 1,
				)
			) {
				this._containerIndex++;
				const rowTemplate = this._rows[0].cloneNode(false);
				nextContainer.appendChild(rowTemplate);
				nextContainersCells.forEach((cell) => rowTemplate.appendChild(cell));
			}
		}
	}

	minRowspanCells(row: HTMLTableRowElement) {
		return Array.from(row.cells)
			.map((cell, index) => {
				return { rowSpan: cell.rowSpan || 1, index };
			})
			.filter((cell) => cell.rowSpan === 1)
			.map((cell) => cell.index);
	}

	static hasRowspanCells(row: HTMLTableRowElement) {
		return Array.from(row.cells).some((cell) => cell.rowSpan > 1);
	}
}
