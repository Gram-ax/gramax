const calculateTabWrapperHeight = (wrapperElement: HTMLDivElement) => {
	const computedStyle = getComputedStyle(wrapperElement);
	const paddingTop = parseFloat(computedStyle.paddingTop);
	const paddingBottom = parseFloat(computedStyle.paddingBottom);
	let height = paddingTop + paddingBottom;

	Array.from(wrapperElement.children).forEach((child) => {
		const elementComputedStyle = getComputedStyle(child);
		const marginTop = parseFloat(elementComputedStyle.marginTop);
		const marginBottom = parseFloat(elementComputedStyle.marginBottom);

		const paddingTop = parseFloat(elementComputedStyle.paddingTop);
		const paddingBottom = parseFloat(elementComputedStyle.paddingBottom);

		height += child.getBoundingClientRect().height + marginTop + marginBottom + paddingTop + paddingBottom;
	});

	return height;
};

export default calculateTabWrapperHeight;
