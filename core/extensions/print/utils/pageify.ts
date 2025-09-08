export function pageify(
	nodes: HTMLElement[],
	reactNodes: React.ReactNode[],
	pageHeightPx: number,
): React.ReactNode[][] {
	const result: React.ReactNode[][] = [[]];
	let acc = 0;

	nodes.forEach((node, i) => {
		const style = window.getComputedStyle(node);
		const marginBottom = parseFloat(style.marginBottom || "0");
		const h = node.offsetHeight + marginBottom;
		const hasTopH1 = node.tagName === "H1" || node.querySelector(":scope > h1") !== null;

		if (hasTopH1 && result[result.length - 1].length > 0) {
			result.push([]);
			acc = 0;
		}

		if (acc + h > pageHeightPx && result[result.length - 1].length > 0) {
			result.push([]);
			acc = 0;
		}

		result[result.length - 1].push(reactNodes[i]);
		acc += h;

		if (acc > pageHeightPx && result[result.length - 1].length > 1) {
			const lastItem = result[result.length - 1].pop() as React.ReactNode;
			result.push([lastItem]);
			acc = h;
		}
	});

	return result;
}
