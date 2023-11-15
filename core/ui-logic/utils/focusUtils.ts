export const focusOnPosition = (textNode: Node, position: number): void => {
	const range = document.createRange();
	const sel = window.getSelection();

	range.setStart(textNode, position);
	range.collapse(true);

	sel.removeAllRanges();
	sel.addRange(range);
};
