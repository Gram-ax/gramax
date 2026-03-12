import { browserLoadFont } from "@ext/pdfExport/fontLoaders/browserLoadFont";
import BrowserCookie from "../../../apps/browser/src/logic/BrowserCookie";
import BrowserGetImageByPath from "../../../apps/browser/src/logic/BrowserGetImageByPath";
import BrowserGetImageFromDom from "../../../apps/browser/src/logic/BrowserGetImageFromDom";
import BrowserGetImageSizeFromImageData from "../../../apps/browser/src/logic/BrowserGetImageSizeFromImageData";
import BrowserSvgToPng from "../../../apps/browser/src/logic/BrowserSvgToPng";
import { getPdfjs } from "../../../apps/browser/src/pdfjs/getPdfjs";
import { WebWorkerResourceParseClient } from "../../../apps/browser/src/search/modulith/WebResourceParseWorkerClient";
import { WebWorkerModulithSearchClient } from "../../../apps/browser/src/search/modulith/WebWorkerModulithSearchClient";
import type { BackendDynamicModules } from "..";

export const getBrowserModules = async (): Promise<BackendDynamicModules> => {
	const { initWasm } =
		typeof window !== "undefined"
			? await import("../../../apps/browser/crates/gramax-wasm/js/wasm")
			: await Promise.resolve({ initWasm: () => Promise.resolve() });

	return {
		svgToPng: BrowserSvgToPng,
		initWasm,
		getImageSizeFromImageData: BrowserGetImageSizeFromImageData,
		getImageFromDom: BrowserGetImageFromDom,
		Cookie: BrowserCookie,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new DOMParser(),
		getXMLSerializer: () => new XMLSerializer(),
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: browserLoadFont,
		getImageByPath: BrowserGetImageByPath,
		getModulithSearchClient: async ({ cacheFileProvider, articleStorageFileProvider }) =>
			await WebWorkerModulithSearchClient.create({ cacheFileProvider, articleStorageFileProvider }),
		getResourceParseClient: async () => await WebWorkerResourceParseClient.create(),
		getPdfjs,
	};
};

let modules: BackendDynamicModules | null = null;

export const initBackendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getBrowserModules();
};

const resolveBackendModule = <K extends keyof BackendDynamicModules>(name: K): BackendDynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveBackendModule;
