import getScale from "@ext/markdown/elements/image/render/logic/getScale";

const getAdjustedSize = (
	width: number,
	height: number,
	maxWidth: number,
	scale?: number | string,
): { width: number; height: number } => {
	const newWidth =
		typeof scale === "string" && scale.endsWith("px")
			? Math.min(parseFloat(scale), maxWidth)
			: scale
				? getScale(scale as number, maxWidth)
				: Math.min(width, maxWidth);
	const aspectRatio = height / width;

	return { width: newWidth, height: aspectRatio * newWidth };
};

export default getAdjustedSize;
