export const getTestModules = async () => {
	const [
		{ default: NextCookie },
		{ default: NextSvgToPng },
		{ default: NextGetImageSizeFromImageData },
		{ default: NextGetImageFromDom },
		xmldom,
		{ loadFontBuffer },
		{ default: NextGetImageByPath },
	] = await Promise.all([
		import("../../../apps/next/logic/NextCookie"),
		import("../../../apps/next/logic/NextSvgToPng"),
		import("../../../apps/next/logic/NextGetImageSizeFromImageData"),
		import("../../../apps/next/logic/NextGetImageFromDom"),
		import("@xmldom/xmldom"),
		import("@ext/pdfExport/fontLoaders/nextLoadFont"),
		import("../../../apps/next/logic/NextGetImageByPath"),
	]);

	return {
		Cookie: NextCookie,
		initWasm: () => Promise.resolve(),
		svgToPng: NextSvgToPng,
		getImageSizeFromImageData: NextGetImageSizeFromImageData,
		getImageFromDom: NextGetImageFromDom,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new xmldom.DOMParser() as any,
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: loadFontBuffer("public/fonts"),
		getImageByPath: NextGetImageByPath,
	};
};
