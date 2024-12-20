import getScale from "@ext/markdown/elements/image/render/logic/getScale";

const getAdjustedSize = (
	width: number,
	height: number,
	maxWidth: number,
	scale?: number,
): { width: number; height: number } => {
	const newWidth = scale ? getScale(scale, maxWidth) : Math.min(width, maxWidth);
	const aspectRatio = height / width;

	return { width: newWidth, height: aspectRatio * newWidth };
};

export default getAdjustedSize;
