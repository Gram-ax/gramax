import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";

export class RowPaginator extends NodePaginator<HTMLTableRowElement> {
	private _currentTr: HTMLTableRowElement;
	private _rows: HTMLTableRowElement[] = [];
	private _rowIndex: number;
	private _cellIndex: number;
	private _currentCell: HTMLTableCellElement;
	private _emptyAccumulatedHeight: number;
	public accumulated: { height: number; rows: number }[] = [];

	constructor(row: HTMLTableRowElement, parentPaginator: Paginator) {
		super(row, parentPaginator);
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const cells = Array.from(this.node.children as HTMLCollectionOf<HTMLTableCellElement>);

		this._currentTr = this.node.cloneNode(false) as HTMLTableRowElement;
		this._rows.push(this._currentTr);

		const accumulatedHeight = Paginator.paginationInfo.accumulatedHeight;
		let accumulatedHeightAfter = 0;
		this.parentPaginator.currentContainer.appendChild(this._currentTr);

		for (this._cellIndex = 0; this._cellIndex < cells.length; this._cellIndex++) {
			this._rowIndex = 0;
			this._currentTr = this._rows[this._rowIndex];

			Paginator.paginationInfo.accumulatedHeight = { ...accumulatedHeight };
			const cell = cells[this._cellIndex];

			if (cell.childNodes.length > 0) {
				this._currentCell = cell;
				this.addDimension();
				this.currentContainer = cell.cloneNode(false) as HTMLTableCellElement;
				await super.paginateSource(cell);
			}
			this._rows[this._rowIndex].appendChild(this.currentContainer);

			for (let index = ++this._rowIndex; index < this._rows.length; index++)
				this._rows[index].appendChild(cell.cloneNode(false));

			this.accumulated.push({
				height: Paginator.paginationInfo.accumulatedHeight.height,
				rows: this._rowIndex,
			});
			if (
				this._rowIndex === this._rows.length &&
				Paginator.paginationInfo.accumulatedHeight.height > accumulatedHeightAfter
			) {
				accumulatedHeightAfter = Paginator.paginationInfo.accumulatedHeight.height;
			}
		}
		Paginator.paginationInfo.accumulatedHeight.height = accumulatedHeightAfter;
	}

	createPage() {
		this.cleanHeadingElementsIfNeed();
		this._rowIndex++;
		const nextRow = this._rows[this._rowIndex];

		if (this.currentContainer.childNodes.length || this._cellIndex) {
			this._currentTr.appendChild(this.currentContainer);
		}

		if (!nextRow) {
			this._currentTr = this._currentTr.cloneNode(false) as HTMLTableRowElement;
			this._rows.push(this._currentTr);
			for (let i = 0; i < this._cellIndex; i++) {
				const cell = this._rows[this._rowIndex - 1].childNodes[i];
				this._currentTr.appendChild(cell.cloneNode(false) as HTMLElement);
			}

			const parent = this.parentPaginator.createPage();
			this._emptyAccumulatedHeight = Paginator.paginationInfo.accumulatedHeight.height;
			parent.appendChild(this._currentTr);
		} else {
			this._currentTr = nextRow;
			Paginator.paginationInfo.accumulatedHeight.height = this._emptyAccumulatedHeight;
		}
		this.currentContainer = this.currentContainer.cloneNode(false) as HTMLElement;

		this.addDimension();
		this.setHeadings();

		return this.currentContainer;
	}

	getUsableHeight(): number {
		const baseHeight = this.parentPaginator.getUsableHeight();
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const cellPadding = nodeDimension.get(this._currentCell)?.paddingH;
		return baseHeight - cellPadding;
	}

	addDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const addDimension = { ...this.nodeDimension };
		addDimension.height = nodeDimension.get(this._currentCell)?.paddingH || 0;
		return this.updateAccumulatedHeightDim(addDimension);
	}
}
