const parsePixels = (width: string): number | null => {
	const pixels = /^(\d+(?:\.\d+)?)px$/.exec(width);
	return pixels ? Number(pixels[1]) : null;
};

export default parsePixels;
