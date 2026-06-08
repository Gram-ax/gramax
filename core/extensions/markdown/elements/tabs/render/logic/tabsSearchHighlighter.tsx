export const tabsSearchHighlighter = (foundEl: HTMLElement) => {
	const tabsEl = foundEl.closest('[data-component="tabs"]');
	if (!tabsEl) return;

	const isFoundElementTabActivator = foundEl.parentElement?.classList.contains("case");
	if (isFoundElementTabActivator) {
		foundEl.click();
		return;
	}

	const tabWithFoundElement = foundEl.closest(".tab");
	if (!tabWithFoundElement) return;

	const tabCaseClassName = Array.from(tabWithFoundElement.classList.values()).find((className) =>
		className.startsWith("c-"),
	);
	if (!tabCaseClassName) return;

	const tabCaseIndex = parseInt(tabCaseClassName.slice(2), 10);
	if (Number.isNaN(tabCaseIndex)) return;

	const neededTabActivator = tabsEl.querySelector<HTMLElement>(`.case:nth-of-type(${tabCaseIndex + 1})`);
	if (!neededTabActivator) return;

	if (!neededTabActivator.classList.contains("active")) neededTabActivator.click();
	// div in editor / span in docportal
	const elementToHighlight = neededTabActivator.querySelector(":scope > *");

	return elementToHighlight ? { additionalElementsToHighlight: [elementToHighlight] } : undefined;
};
