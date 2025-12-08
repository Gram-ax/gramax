import Paginator from "@ext/print/utils/pagination/Paginator";
import { throwIfAborted } from "@ext/print/utils/pagination/abort";
import { RowPaginator } from "@ext/markdown/elements/table/print/RowPaginator";
import NodePaginator from "@ext/print/utils/pagination/NodePaginator";

export class TablePaginator extends NodePaginator<HTMLDivElement> {
	private currentTableWrapper: HTMLDivElement;
	private repeatThead: HTMLTableSectionElement;
	private table: HTMLDivElement;

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

		for (const row of allRows) {
			const rowHeight = Paginator.paginationInfo.nodeDimension.get(row).height;

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

	private cloneTableShell() {
		const newTable = this.table.cloneNode(false) as HTMLDivElement;
		for (const attr of Array.from(this.table.attributes)) newTable.setAttribute(attr.name, attr.value);

		const colgroup = this.table.querySelector("colgroup");
		if (colgroup) newTable.appendChild(colgroup.cloneNode(true));

		if (this.repeatThead) newTable.appendChild(this.repeatThead.cloneNode(true));

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
}
