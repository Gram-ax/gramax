export const TITLE_HEADER_CLASS = "title-page-header";
export const TITLE_TOP_ELEMENT_CLASS = "title-page-top";
export const TITLE_TOP_ELEMENT_LEFT_CLASS = "title-page-top-left";
export const TITLE_TOP_ELEMENT_RIGHT_CLASS = "title-page-top-right";
export const TITLE_BOTTOM_ELEMENT_CLASS = "title-page-bottom";
export const TITLE_BOTTOM_ELEMENT_LEFT_CLASS = "title-page-bottom-left";
export const TITLE_BOTTOM_ELEMENT_RIGHT_CLASS = "title-page-bottom-right";

export const TITLE_PAGE_CLASS = "title-page";

export const getTitlePageContent = (title: string) => {
	const titleElement = document.createElement("h1");
	titleElement.className = TITLE_HEADER_CLASS;
	titleElement.textContent = title ?? "";

	const topElement = document.createElement("div");
	topElement.className = TITLE_TOP_ELEMENT_CLASS;
	const topElementLeft = document.createElement("div");
	topElementLeft.className = TITLE_TOP_ELEMENT_LEFT_CLASS;
	const topElementRight = document.createElement("div");
	topElementRight.className = TITLE_TOP_ELEMENT_RIGHT_CLASS;
	topElement.appendChild(topElementLeft);
	topElement.appendChild(topElementRight);

	const bottomElement = document.createElement("div");
	bottomElement.className = TITLE_BOTTOM_ELEMENT_CLASS;
	const bottomElementLeft = document.createElement("div");
	bottomElementLeft.className = TITLE_BOTTOM_ELEMENT_LEFT_CLASS;
	const bottomElementRight = document.createElement("div");
	bottomElementRight.className = TITLE_BOTTOM_ELEMENT_RIGHT_CLASS;
	bottomElement.appendChild(bottomElementLeft);
	bottomElement.appendChild(bottomElementRight);
	return { titleElement, topElement, bottomElement };
};
