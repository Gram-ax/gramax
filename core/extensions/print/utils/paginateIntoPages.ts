import { HEIGHT_TOLERANCE_PX } from "@ext/print/const";

const createPage = (pages: HTMLElement): HTMLElement => {
	const page = document.createElement("div");
	page.className = "page";
	pages.appendChild(page);
	return page;
};

const getUsableHeight = (el: HTMLElement): number => {
	const cs = getComputedStyle(el);
	const paddingV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
	return el.clientHeight - paddingV;
};

const fitsAfterAppend = (page: HTMLElement, node: HTMLElement): boolean => {
	page.appendChild(node);
	const ok = page.scrollHeight <= page.clientHeight + HEIGHT_TOLERANCE_PX;
	if (!ok) page.removeChild(node);
	return ok;
};

const getRepeatableThead = (srcTable: HTMLTableElement): HTMLTableSectionElement | null => {
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
	newThead.appendChild(headerRow.cloneNode(true));
	newThead.dataset._synthesized = "1";
	return newThead;
};

const cloneTableShell = (
	srcTable: HTMLTableElement,
	repeatThead: HTMLTableSectionElement | null,
): { table: HTMLTableElement; tbody: HTMLTableSectionElement } => {
	const newTable = srcTable.cloneNode(false) as HTMLTableElement;
	for (const attr of Array.from(srcTable.attributes)) newTable.setAttribute(attr.name, attr.value);

	const colgroup = srcTable.querySelector("colgroup");
	if (colgroup) newTable.appendChild(colgroup.cloneNode(true));

	if (repeatThead) newTable.appendChild(repeatThead.cloneNode(true));

	const tbody = document.createElement("tbody");
	newTable.appendChild(tbody);
	return { table: newTable, tbody };
};

const collectBodyRows = (
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
				if (tr.isEqualNode(headerRowFromFirst) || !skippedFirst) {
					skippedFirst = true;
					return;
				}
			}
			rows.push(tr);
		});
	});

	return rows;
};

const paginateTable = (pages: HTMLElement, srcTable: HTMLTableElement, currentPage: HTMLElement): HTMLElement => {
	const repeatThead = getRepeatableThead(srcTable);
	const allRows = collectBodyRows(srcTable, repeatThead);
	const tfoot = srcTable.querySelector("tfoot");

	let { table, tbody } = cloneTableShell(srcTable, repeatThead);
	let page = currentPage;

	if (!fitsAfterAppend(page, table)) {
		page = createPage(pages);
		page.appendChild(table);
	}

	for (const row of allRows) {
		tbody.appendChild(row);
		if (page.scrollHeight <= page.clientHeight + HEIGHT_TOLERANCE_PX) continue;

		tbody.removeChild(row);
		if (tbody.children.length === 0) {
			table.classList.add("overflow-warning");
			tbody.appendChild(row);
			({ table, tbody } = cloneTableShell(srcTable, repeatThead));
			page = createPage(pages);
			page.appendChild(table);
			continue;
		}

		({ table, tbody } = cloneTableShell(srcTable, repeatThead));
		page = createPage(pages);
		page.appendChild(table);

		tbody.appendChild(row);
		const usableH2 = getUsableHeight(page);
		if (page.scrollHeight > usableH2 + HEIGHT_TOLERANCE_PX) table.classList.add("overflow-warning");
	}

	if (tfoot) {
		const tmpTFoot = tfoot.cloneNode(true);
		table.appendChild(tmpTFoot);
		const usableH = getUsableHeight(page);
		if (page.scrollHeight > usableH + HEIGHT_TOLERANCE_PX) {
			table.removeChild(tmpTFoot);
			const shell = cloneTableShell(srcTable, repeatThead);
			shell.table.appendChild(tfoot.cloneNode(true));
			page = createPage(pages);
			page.appendChild(shell.table);
		}
	}

	srcTable.remove();
	return page;
};

function paginateIntoPages(source: HTMLElement, pages: HTMLElement, onDone?: VoidFunction): void {
	pages.innerHTML = "";
	let currentPage = createPage(pages);

	while (source.firstElementChild) {
		const node = source.firstElementChild as HTMLElement;

		if (node.tagName === "H1") {
			if (currentPage.childElementCount > 0) currentPage = createPage(pages);
			currentPage.appendChild(node);
			continue;
		}

		if (node.tagName === "TABLE") {
			currentPage = paginateTable(pages, node as HTMLTableElement, currentPage);
			continue;
		}

		if (!fitsAfterAppend(currentPage, node)) {
			currentPage = createPage(pages);
			if (!fitsAfterAppend(currentPage, node)) {
				currentPage.appendChild(node);
				node.classList.add("overflow-warning");
			}
		}
	}
	onDone?.();
}

export default paginateIntoPages;
