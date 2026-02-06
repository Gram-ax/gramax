import { browserLoadFont } from "@ext/pdfExport/fontLoaders/browserLoadFont";
import BrowserCookie from "../../../apps/browser/src/logic/BrowserCookie";
import BrowserGetImageByPath from "../../../apps/browser/src/logic/BrowserGetImageByPath";
import BrowserGetImageFromDom from "../../../apps/browser/src/logic/BrowserGetImageFromDom";
import BrowserGetImageSizeFromImageData from "../../../apps/browser/src/logic/BrowserGetImageSizeFromImageData";
import BrowserSvgToPng from "../../../apps/browser/src/logic/BrowserSvgToPng";
import type { BackendDynamicModules } from "..";

export const getStaticModules = async (): Promise<BackendDynamicModules> => {
	return Promise.resolve({
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
		getImageByPath: BrowserGetImageByPath,
	});
};

let modules: BackendDynamicModules | null = null;

export const initBackendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getStaticModules();
};

const resolveBackendModule = <K extends keyof BackendDynamicModules>(name: K): BackendDynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveBackendModule;
