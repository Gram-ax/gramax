import { browserLoadFont } from "@ext/pdfExport/fontLoaders/browserLoadFont";
import TauriGetImageByPath from "../../../apps/browser/src/logic/BrowserGetImageByPath";
import TauriGetImageFromDom from "../../../apps/browser/src/logic/BrowserGetImageFromDom";
import TauriGetImageSizeFromImageData from "../../../apps/browser/src/logic/BrowserGetImageSizeFromImageData";
import TauriSvgToPng from "../../../apps/browser/src/logic/BrowserSvgToPng";
import TauriCookie from "../../../apps/tauri/src/cookie/TauriCookie";
import * as tauriCommands from "../../../apps/tauri/src/window/commands";
import type { BackendDynamicModules } from "..";

export const getTauriModules = async (): Promise<BackendDynamicModules> => {
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
		pdfLoadFont: browserLoadFont,
		getImageByPath: TauriGetImageByPath,
	};
};

let modules: BackendDynamicModules | null = null;

export const initBackendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getTauriModules();
};

const resolveBackendModule = <K extends keyof BackendDynamicModules>(name: K): BackendDynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveBackendModule;
