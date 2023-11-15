const setFocus = (element: HTMLElement | Node, isLeft?: boolean) => {
	const select = window.getSelection();
	const range = document.createRange();
	if (!range) return;
	if (isLeft) range.setStart(element, 0);
	else range.setStart(element, 1);
	range.collapse(true);
	select.removeAllRanges();
	select.addRange(range);
	if ((element as HTMLElement)?.focus) (element as HTMLElement).focus();
};

export default setFocus;
