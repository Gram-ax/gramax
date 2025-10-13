import { DynamicModules } from "@app/resolveModule/backend";

export const getStaticModules = async (): Promise<DynamicModules> => {
	const [
		{ default: BrowserCookie },
		{ default: BrowserSvgToPng },
		{ default: BrowserGetImageSizeFromImageData },
		{ default: BrowserGetImageFromDom },
		{ browserLoadFont },
		{ default: StaticGetImageByPath },
	] = await Promise.all([
		import("../../../apps/browser/src/logic/BrowserCookie"),
		import("../../../apps/browser/src/logic/BrowserSvgToPng"),
		import("../../../apps/browser/src/logic/BrowserGetImageSizeFromImageData"),
		import("../../../apps/browser/src/logic/BrowserGetImageFromDom"),
		import("@ext/pdfExport/fontLoaders/browserLoadFont"),
		import("../../../apps/browser/src/logic/BrowserGetImageByPath"),
	]);

	return {
		Cookie: BrowserCookie,
		initWasm: () => Promise.resolve(),
		svgToPng: BrowserSvgToPng,
		getImageSizeFromImageData: BrowserGetImageSizeFromImageData,
		getImageFromDom: BrowserGetImageFromDom,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new DOMParser(),
		getXMLSerializer: () => new XMLSerializer(),
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: browserLoadFont,
		getImageByPath: StaticGetImageByPath,
	};
};
