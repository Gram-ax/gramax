import { createPage, PAGE_CLASS } from "@ext/print/utils/pagination/pageElements";
import {
	TOC_PAGE_CLASS,
	TOC_PAGE_HEADER_CLASS,
	TOC_PAGE_ITEM_CLASS,
	TOC_PAGE_ITEM_DOTS_CLASS,
	TOC_PAGE_ITEM_LINK_CLASS,
	TOC_PAGE_ITEM_NUMBER_CLASS,
	TOC_PAGE_ITEM_RIGHT_CLASS,
	TOC_PAGE_ITEM_TITLE_CLASS,
	TOC_PAGE_ITEMS_CLASS,
} from "@ext/print/utils/tocPage/consts";
import layoutTocLine from "@ext/print/utils/tocPage/layoutTocLine";

export interface PrintablePage {
	title: string;
	level: number;
}

export function insertAfterTitleOrFirst(pages: HTMLElement, element: HTMLElement): void {
	const title = pages.querySelector(":scope > .title-page");
	if (title) title.insertAdjacentElement("afterend", element);
	else pages.prepend(element);
}

function ensurePageIds(pages: HTMLElement): HTMLElement[] {
	const pageNodes = Array.from(pages.querySelectorAll<HTMLElement>(`:scope > .${PAGE_CLASS}`));
	pageNodes.forEach((page, i) => {
		const num = i + 1;
		if (!page.id) page.id = `p-${num}`;
		if (!page.dataset.pageNumber) page.dataset.pageNumber = String(num);
	});
	return pageNodes;
}

const norm = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();

function buildItemFirstPageByH1(pages: HTMLElement, items: PrintablePage[]): (number | undefined)[] {
	const firstPage: (number | undefined)[] = new Array(items.length).fill(undefined);
	const indexQueues = new Map<string, number[]>();
	items.forEach((it, i) => {
		const key = norm(it.title ?? "");
		const arr = indexQueues.get(key);
		if (arr) arr.push(i);
		else indexQueues.set(key, [i]);
	});

	const pageNodes = ensurePageIds(pages);
	for (const page of pageNodes) {
		const headings = page.querySelectorAll<HTMLHeadingElement>("h1");
		if (!headings) continue;
		headings.forEach((h1) => {
			const key = norm(h1.textContent ?? "");
			const queue = indexQueues.get(key);
			if (!queue?.length) return;

			const itemIndex = queue.shift();
			const num = Number(page.dataset.pageNumber) || 0;
			if (num) firstPage[itemIndex] = num;
		});
	}
	return firstPage;
}

function createTocPage(pages, afterend?: HTMLElement): { page: HTMLElement; ul: HTMLUListElement } {
	const page = createPage(pages, { prepend: true, afterend, classNames: [PAGE_CLASS, TOC_PAGE_CLASS] });

	if (!afterend) {
		const h = document.createElement("h1");
		h.className = TOC_PAGE_HEADER_CLASS;
		h.textContent = "Оглавление";
		page.appendChild(h);
	}

	const ul = document.createElement("ul");
	ul.className = TOC_PAGE_ITEMS_CLASS;
	page.appendChild(ul);

	return { page, ul };
}

function isOverflow(page: HTMLElement, ul: HTMLElement): boolean {
	const pageBottom = page.getBoundingClientRect().bottom;
	const ulBottom = ul.getBoundingClientRect().bottom;
	return ulBottom > pageBottom - 0.5;
}

export const initTocPageContent = (pages: HTMLElement, items: PrintablePage[], hasTitlePage: boolean) => {
	ensurePageIds(pages);
	const firstPageNumbers = buildItemFirstPageByH1(pages, items);

	let { page: curPage, ul: curUl } = createTocPage(pages);

	const tocPages: HTMLElement[] = [curPage];
	const numberSpans: HTMLSpanElement[] = [];
	const liElements: HTMLLIElement[] = [];

	for (let i = 0; i < items.length; i++) {
		const basePageNum = firstPageNumbers[i];
		if (!basePageNum) continue;

		const it = items[i];

		const li = document.createElement("li");
		li.className = `${TOC_PAGE_ITEM_CLASS}`;
		li.dataset.level = `${it.level}`;
		li.style.marginLeft = `${Math.max(0, it.level - 1) * 1.5}em`;

		const a = document.createElement("a");
		a.className = TOC_PAGE_ITEM_LINK_CLASS;
		a.href = `#p-${basePageNum}`;

		const titleSpan = document.createElement("span");
		titleSpan.className = TOC_PAGE_ITEM_TITLE_CLASS;
		titleSpan.textContent = it.title ?? "";

		const dotSpan = document.createElement("span");
		dotSpan.className = TOC_PAGE_ITEM_DOTS_CLASS;

		const numSpan = document.createElement("span");
		numSpan.className = TOC_PAGE_ITEM_NUMBER_CLASS;
		numSpan.dataset.base = String(basePageNum);
		numberSpans.push(numSpan);

		const right = document.createElement("span");
		right.className = TOC_PAGE_ITEM_RIGHT_CLASS;
		right.appendChild(dotSpan);
		right.appendChild(numSpan);

		a.appendChild(titleSpan);
		a.appendChild(right);
		li.appendChild(a);

		curUl.appendChild(li);

		if (isOverflow(curPage, curUl)) {
			curUl.removeChild(li);

			const created = createTocPage(pages, curPage.parentElement);
			tocPages.push(created.page);

			curPage = created.page;
			curUl = created.ul;

			curUl.appendChild(li);
		}
		liElements.push(li);
	}

	const offset = (hasTitlePage ? 1 : 0) + tocPages.length;
	let maxPageNumber = 0;

	numberSpans.forEach((span) => {
		const base = Number(span.dataset.base || "0");
		const finalNum = base + offset;
		span.textContent = String(finalNum);

		if (finalNum > maxPageNumber) maxPageNumber = finalNum;
	});

	const maxDigits = String(maxPageNumber).length;

	liElements.forEach((li) => {
		layoutTocLine(li, maxDigits);
	});
};
