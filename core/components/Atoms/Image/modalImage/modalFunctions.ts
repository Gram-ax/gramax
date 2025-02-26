export const ZOOM_COUNT = 10;

export const calculateTransform = (startPos: DOMRect): string =>
	`
	translate3d(
		${startPos.left - (window.innerWidth - startPos.width) / 2}px,
		${startPos.top - (window.innerHeight - startPos.height) / 2}px,
		0
	) scale(0.5, 0.5);
`;

export const getClampedValues = (realSize: { width: number; height: number }): { [key: string]: number } => {
	const maxWidth = (realSize.width - window.innerWidth) / 2;
	const maxHeight = (realSize.height - window.innerHeight) / 2;

	return { minWidth: -maxWidth, maxWidth, maxHeight, minHeight: -maxHeight };
};

export const getCanMoves = (targetRect: DOMRect): { left: boolean; right: boolean; top: boolean; bottom: boolean } => {
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;

	return {
		left: targetRect.left - 1 <= 1,
		right: targetRect.right > viewportWidth - 1,
		top: targetRect.top - 1 <= 1,
		bottom: targetRect.bottom > viewportHeight - 1,
	};
};

export const getLimits = (element: HTMLElement) => {
	const currentHeight = element.offsetHeight;
	const computedMaxHeight = (window.innerHeight / 100) * 80;
	const computedMinHeight = (window.innerHeight / 100) * 10;

	return {
		max: (computedMaxHeight / currentHeight) * 2,
		min: computedMinHeight / currentHeight,
	};
};
