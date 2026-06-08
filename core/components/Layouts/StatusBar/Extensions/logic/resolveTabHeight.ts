const resolveTabHeight = (wrapperElement: HTMLDivElement) => {
	const wrapperStyle = getComputedStyle(wrapperElement);
	const paddingTop = parseFloat(wrapperStyle.paddingTop);
	const paddingBottom = parseFloat(wrapperStyle.paddingBottom);
	const maxHeight = parseFloat(wrapperStyle.maxHeight);

	let height = paddingTop + paddingBottom;

	for (const child of Array.from(wrapperElement.children)) {
		const childStyle = getComputedStyle(child);
		const marginTop = parseFloat(childStyle.marginTop);
		const marginBottom = parseFloat(childStyle.marginBottom);
		height += child.scrollHeight + marginTop + marginBottom;
	}

	return Math.min(height, maxHeight);
};

export default resolveTabHeight;
