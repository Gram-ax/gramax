import { DynamicModules } from "@app/resolveModule/backend";

export const getBrowserModules = async (): Promise<DynamicModules> => {
	const [
		{ default: BrowserCookie },
		{ initWasm },
		{ default: BrowserSvgToPng },
		{ default: BrowserGetImageSizeFromImageData },
		{ default: BrowserGetImageFromDom },
		{ browserLoadFont },
		{ default: BrowserGetImageByPath },
	] = await Promise.all([
		import("../../../apps/browser/src/logic/BrowserCookie"),
		typeof window !== "undefined"
			? import("../../../apps/browser/crates/gramax-wasm/js/wasm")
			: Promise.resolve({ initWasm: () => Promise.resolve() }),
		import("../../../apps/browser/src/logic/BrowserSvgToPng"),
		import("../../../apps/browser/src/logic/BrowserGetImageSizeFromImageData"),
		import("../../../apps/browser/src/logic/BrowserGetImageFromDom"),
		import("@ext/pdfExport/fontLoaders/browserLoadFont"),
		import("../../../apps/browser/src/logic/BrowserGetImageByPath"),
	]);

	return {
		Cookie: BrowserCookie,
		initWasm,
		svgToPng: BrowserSvgToPng,
		getImageSizeFromImageData: BrowserGetImageSizeFromImageData,
		getImageFromDom: BrowserGetImageFromDom,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new DOMParser(),
		getXMLSerializer: () => new XMLSerializer(),
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: browserLoadFont,
		getImageByPath: BrowserGetImageByPath,
	};
};
