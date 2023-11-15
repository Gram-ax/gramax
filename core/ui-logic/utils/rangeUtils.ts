export const splitRange = (element: HTMLElement, offset: number): { beforeOffset: Range; afterOffset: Range } => {
	const rangeStartToFocus = document.createRange();
	const rangeFocusToEnd = document.createRange();

	rangeStartToFocus.setStart(element.firstChild, 0);
	rangeStartToFocus.setEnd(element.firstChild, offset);

	rangeFocusToEnd.setStart(element.firstChild, offset);
	rangeFocusToEnd.setEnd(element.firstChild, element.innerText.length);

	return { beforeOffset: rangeStartToFocus, afterOffset: rangeFocusToEnd };
};
