import NodePaginator from "@ext/print/utils/pagination/NodePaginator";
import Paginator from "@ext/print/utils/pagination/Paginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";

export class RowPaginator extends NodePaginator<HTMLTableRowElement> {
	private currentTr: HTMLTableRowElement;
	private rows: HTMLTableRowElement[] = [];
	private rowIndex: number;
	private cellIndex: number;
	private currentCell: HTMLTableCellElement;

	constructor(row: HTMLTableRowElement, parentPaginator: Paginator) {
		super(row, parentPaginator);
	}

	async paginateNode() {
		throwIfAborted(Paginator.controlInfo.signal);

		const cells = Array.from(this.node.children as HTMLCollectionOf<HTMLTableCellElement>);

		this.currentTr = this.node.cloneNode(false) as HTMLTableRowElement;
		this.rows.push(this.currentTr);

		const accumulatedHeight = Paginator.paginationInfo.accumulatedHeight;
		this.parentPaginator.currentContainer.appendChild(this.currentTr);

		for (this.cellIndex = 0; this.cellIndex < cells.length; this.cellIndex++) {
			this.rowIndex = 0;
			Paginator.paginationInfo.accumulatedHeight = { ...accumulatedHeight };

			const cell = cells[this.cellIndex];

			if (cell.childNodes.length > 0) {
				this.currentCell = cell;
				this.addDimension();
				this.currentContainer = cell.cloneNode(false) as HTMLTableCellElement;
				await super.paginateSource(cell);
			}
			this.rows[this.rowIndex].appendChild(this.currentContainer);

			for (let index = ++this.rowIndex; index < this.rows.length; index++)
				this.rows[index].appendChild(cell.cloneNode(false));
		}
	}

	createPage() {
		this.cleanHeadingElementsIfNeed();
		this.rowIndex++;
		const existRow = !!this.rows[this.rowIndex];

		if (this.currentContainer.childNodes.length) {
			this.currentTr.appendChild(this.currentContainer);
		}

		if (!existRow) {
			this.currentTr = this.currentTr.cloneNode(false) as HTMLTableRowElement;
			this.rows.push(this.currentTr);
			for (let i = 0; i < this.cellIndex; i++)
				this.currentTr.appendChild(this.currentContainer.cloneNode(false) as HTMLElement);

			const parent = this.parentPaginator.createPage();
			parent.appendChild(this.currentTr);
		}
		this.currentContainer = this.currentContainer.cloneNode(false) as HTMLElement;

		this.addDimension();
		this.setHeadings();
		return this.currentContainer;
	}

	getUsableHeight(): number {
		const baseHeight = this.parentPaginator.getUsableHeight();
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const cellPadding = nodeDimension.get(this.currentCell)?.paddingH;
		return baseHeight - cellPadding;
	}

	addDimension() {
		const nodeDimension = Paginator.paginationInfo.nodeDimension;
		const addDimension = { ...this.nodeDimension };
		addDimension.height = nodeDimension.get(this.currentCell)?.paddingH || 0;
		return this.updateAccumulatedHeightDim(addDimension);
	}
}
