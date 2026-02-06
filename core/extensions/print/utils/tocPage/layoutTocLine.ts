import {
	TOC_PAGE_ITEM_DOTS_CLASS,
	TOC_PAGE_ITEM_LINK_CLASS,
	TOC_PAGE_ITEM_NUMBER_CLASS,
	TOC_PAGE_ITEM_RIGHT_CLASS,
	TOC_PAGE_ITEM_TITLE_CLASS,
} from "@ext/print/utils/tocPage/consts";

const layoutTocLine = (li: HTMLLIElement, numColumnWidthCh: number) => {
	const link = li.querySelector<HTMLElement>(`.${TOC_PAGE_ITEM_LINK_CLASS}`);
	const title = li.querySelector<HTMLElement>(`.${TOC_PAGE_ITEM_TITLE_CLASS}`);
	const right = li.querySelector<HTMLElement>(`.${TOC_PAGE_ITEM_RIGHT_CLASS}`);
	const dots = li.querySelector<HTMLElement>(`.${TOC_PAGE_ITEM_DOTS_CLASS}`);
	const num = li.querySelector<HTMLElement>(`.${TOC_PAGE_ITEM_NUMBER_CLASS}`);
	if (!link || !title || !right || !dots || !num) return;

	link.style.paddingRight = `${numColumnWidthCh}ch`;

	const range = document.createRange();
	range.selectNodeContents(title);
	const rects = range.getClientRects();
	if (!rects.length) return;

	const lastLineRect = rects[rects.length - 1];

	right.style.width = `${numColumnWidthCh}ch`;
	const rightRect = right.getBoundingClientRect();

	const startX = lastLineRect.right;
	const rightLeft = rightRect.left;

	const availableWidth = Math.max(0, rightLeft - startX);
	right.style.width = `calc(${numColumnWidthCh}ch + ${availableWidth}px)`;
};
export default layoutTocLine;
