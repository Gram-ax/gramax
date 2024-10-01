export function isElementNearEdges(element: HTMLElement): boolean {
	const rect = element.getBoundingClientRect();
	const windowHeight = window.innerHeight;

	const distanceFromTop = rect.top;
	const distanceFromBottom = windowHeight - rect.bottom;

	const topEdgeThreshold = windowHeight * 0.05;
	const bottomEdgeThreshold = windowHeight * 0.05;

	return distanceFromTop < topEdgeThreshold || distanceFromBottom < bottomEdgeThreshold;
}
