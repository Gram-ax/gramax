import { HEIGHT_TOLERANCE_PX } from "@ext/print/const";
import { ArticlePreview, PdfPrintParams } from "@ext/print/types";
import { initTocPageContent } from "./initTocPageContent";

export const TITLE_HEADER_CLASS = "title-page-header";
export const TITLE_TOP_ELEMENT_CLASS = "title-page-top";
export const TITLE_TOP_ELEMENT_LEFT_CLASS = "title-page-top-left";
export const TITLE_TOP_ELEMENT_RIGHT_CLASS = "title-page-top-right";

export const TITLE_PAGE_CLASS = "title-page";
export const PAGE_CLASS = "page";

export const createPage = (pages: HTMLElement, prepend = false): HTMLElement => {
	const page = document.createElement("div");
	page.className = PAGE_CLASS;
	if (prepend) pages.prepend(page);
	else pages.appendChild(page);
	return page;
};

const getTitlePageContent = (title: string): { titleElement: HTMLElement; topElement: HTMLElement } => {
	const titleElement = document.createElement("h1");
	titleElement.className = TITLE_HEADER_CLASS;
	titleElement.textContent = (title ?? "").replace(/^\d+\.\s*/, "");

	const topElement = document.createElement("div");
	topElement.className = TITLE_TOP_ELEMENT_CLASS;
	const topElementLeft = document.createElement("div");
	topElementLeft.className = TITLE_TOP_ELEMENT_LEFT_CLASS;
	const topElementRight = document.createElement("div");
	topElementRight.className = TITLE_TOP_ELEMENT_RIGHT_CLASS;
	topElement.appendChild(topElementLeft);
	topElement.appendChild(topElementRight);

	return { titleElement, topElement };
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

function paginateIntoPages(
	source: HTMLElement,
	pages: HTMLElement,
	params: PdfPrintParams,
	items: ArticlePreview[],
	onDone?: VoidFunction,
): void {
	pages.innerHTML = "";
	const title = items?.[0]?.title ?? "None title";
	let currentPage = createPage(pages);

	if (params.template) {
		const template = document.createElement("style");
		template.textContent = params.template;
		pages.appendChild(template);
	}

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

	if (params.tocPage) initTocPageContent(pages, items, params.titlePage);

	if (params.titlePage) {
		const { titleElement, topElement } = getTitlePageContent(title);
		currentPage = createPage(pages, true);
		currentPage.classList.add(TITLE_PAGE_CLASS);
		currentPage.appendChild(topElement);
		currentPage.appendChild(titleElement);
	}

	onDone?.();
}

export default paginateIntoPages;
