import { DynamicModules } from "@app/resolveModule/backend";

export const getTauriModules = async (): Promise<DynamicModules> => {
	const [
		{ default: TauriCookie },
		{ default: TauriSvgToPng },
		{ default: TauriGetImageSizeFromImageData },
		{ default: TauriGetImageFromDom },
		tauriCommands,
		{ browserLoadFont: tauriLoadFont },
		{ default: TauriGetImageByPath },
	] = await Promise.all([
		import("../../../apps/tauri/src/cookie/TauriCookie"),
		import("../../../apps/browser/src/logic/BrowserSvgToPng"),
		import("../../../apps/browser/src/logic/BrowserGetImageSizeFromImageData"),
		import("../../../apps/browser/src/logic/BrowserGetImageFromDom"),
		import("../../../apps/tauri/src/window/commands"),
		import("@ext/pdfExport/fontLoaders/browserLoadFont"),
		import("../../../apps/browser/src/logic/BrowserGetImageByPath"),
	]);

	return {
		Cookie: TauriCookie,
		initWasm: () => Promise.resolve(),
		svgToPng: TauriSvgToPng,
		getImageSizeFromImageData: TauriGetImageSizeFromImageData,
		getImageFromDom: TauriGetImageFromDom,
		moveToTrash: tauriCommands.moveToTrash,
		getDOMParser: () => new DOMParser(),
		getXMLSerializer: () => new XMLSerializer(),
		setSessionData: tauriCommands.setSessionData,
		pdfLoadFont: tauriLoadFont,
		getImageByPath: TauriGetImageByPath,
	};
};
