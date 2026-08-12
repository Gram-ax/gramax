import { webLoadFont } from "@ext/pdfExport/fontLoaders/webLoadFont";
import TauriCookie from "../../../apps/tauri/src/cookie/TauriCookie";
import * as tauriCommands from "../../../apps/tauri/src/window/commands";
import TauriGetImageByPath from "../../../apps/web/src/logic/WebGetImageByPath";
import TauriGetImageFromDom from "../../../apps/web/src/logic/WebGetImageFromDom";
import TauriGetImageSizeFromImageData from "../../../apps/web/src/logic/WebGetImageSizeFromImageData";
import TauriSvgToPng from "../../../apps/web/src/logic/WebSvgToPng";
import { mermaidExtractText } from "../../../apps/web/src/mermaid/mermaidExtractText";
import { getPdfjs } from "../../../apps/web/src/pdfjs/getPdfjs";
import { WebWorkerResourceParseClient } from "../../../apps/web/src/search/modulith/WebResourceParseWorkerClient";
import { WebWorkerModulithSearchClient } from "../../../apps/web/src/search/modulith/WebWorkerModulithSearchClient";
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
		pdfLoadFont: webLoadFont,
		getImageByPath: TauriGetImageByPath,
		mermaidExtractText,
		getModulithSearchClient: async ({ cacheFileProvider, articleStorageFileProvider }) =>
			await WebWorkerModulithSearchClient.create({ cacheFileProvider, articleStorageFileProvider }),
		getResourceParseClient: async () => await WebWorkerResourceParseClient.create(),
		getPdfjs,
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
