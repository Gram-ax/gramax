export const PAGE_CLASS = "page";
export const PAGE_CONTENT_CLASS = "page-content";

export const createPage = (
	pages: HTMLElement,
	options: { prepend?: boolean; afterend?: HTMLElement; isTitle?: boolean; classNames?: string[] } = {},
): HTMLElement => {
	const page = document.createElement("div");
	page.classList.add(PAGE_CLASS, ...(options.classNames || []));

	switch (true) {
		case !!options.afterend:
			pages.prepend(page);
			options.afterend.insertAdjacentElement("afterend", page);
			break;
		case options.prepend:
			pages.prepend(page);
			if (options.isTitle) return page;
			break;
		default:
			pages.appendChild(page);
	}

	const top = document.createElement("div");
	top.className = "page-top";
	const topLeft = document.createElement("div");
	topLeft.className = "page-top-left";
	const topRight = document.createElement("div");
	topRight.className = "page-top-right";
	top.appendChild(topLeft);
	top.appendChild(topRight);
	page.appendChild(top);

	const content = document.createElement("div");
	content.className = PAGE_CONTENT_CLASS;
	page.appendChild(content);

	const bottom = document.createElement("div");
	bottom.className = "page-bottom";
	const bottomLeft = document.createElement("div");
	bottomLeft.className = "page-bottom-left";
	const bottomRight = document.createElement("div");
	bottomRight.className = "page-bottom-right";
	bottom.appendChild(bottomLeft);
	bottom.appendChild(bottomRight);
	page.appendChild(bottom);

	return content;
};

export const getUsableWidth = (el: HTMLElement): number => {
	const cs = getComputedStyle(el);
	const paddingV = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
	return el.clientWidth - paddingV;
};

export const getUsableHeight = (el: HTMLElement): number => {
	const cs = getComputedStyle(el);
	const paddingV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
	return el.clientHeight - paddingV;
};

let usableHeightCache = new WeakMap<HTMLElement, number>();

export const getUsableHeightCached = (el: HTMLElement): number => {
	const cached = usableHeightCache.get(el);
	if (cached != null) return cached;
	const value = getUsableHeight(el);
	usableHeightCache.set(el, value);
	return value;
};

export const clearUsableHeightCache = () => {
	usableHeightCache = new WeakMap<HTMLElement, number>();
};
