export const ZOOM_COUNT = 10;

export const calculateTransform = (startPos: DOMRect): string => {
	if (!startPos) return "translate(0px, 0px) scale(1)";
	const centerX = window.innerWidth / 2;
	const centerY = window.innerHeight / 2;

	const startCenterX = startPos.left + startPos.width / 2;
	const startCenterY = startPos.top + startPos.height / 2;

	const translateX = startCenterX - centerX;
	const translateY = startCenterY - centerY;

	const scale = 1;

	return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
};

export const getClampedValues = (realSize: { width: number; height: number }): { [key: string]: number } => {
	if (!realSize) return { minWidth: 0, maxWidth: 0, maxHeight: 0, minHeight: 0 };
	const maxWidth = (realSize.width - window.innerWidth) / 2;
	const maxHeight = (realSize.height - window.innerHeight) / 2;

	return { minWidth: -maxWidth, maxWidth, maxHeight, minHeight: -maxHeight };
};

export const getCanMoves = (targetRect: DOMRect): { left: boolean; right: boolean; top: boolean; bottom: boolean } => {
	if (!targetRect) return { left: false, right: false, top: false, bottom: false };
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
