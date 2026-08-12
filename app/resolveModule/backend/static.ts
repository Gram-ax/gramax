import { webLoadFont } from "@ext/pdfExport/fontLoaders/webLoadFont";
import WebCookie from "../../../apps/web/src/logic/WebCookie";
import WebGetImageByPath from "../../../apps/web/src/logic/WebGetImageByPath";
import WebGetImageFromDom from "../../../apps/web/src/logic/WebGetImageFromDom";
import WebGetImageSizeFromImageData from "../../../apps/web/src/logic/WebGetImageSizeFromImageData";
import WebSvgToPng from "../../../apps/web/src/logic/WebSvgToPng";
import { mermaidExtractText } from "../../../apps/web/src/mermaid/mermaidExtractText";
import { getPdfjs } from "../../../apps/web/src/pdfjs/getPdfjs";
import { WebWorkerModulithSearchClient } from "../../../apps/web/src/search/modulith/WebWorkerModulithSearchClient";
import type { BackendDynamicModules } from "..";

export const getStaticModules = async (): Promise<BackendDynamicModules> => {
	return Promise.resolve({
		Cookie: WebCookie,
		initWasm: () => Promise.resolve(),
		svgToPng: WebSvgToPng,
		getImageSizeFromImageData: WebGetImageSizeFromImageData,
		getImageFromDom: WebGetImageFromDom,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new DOMParser(),
		getXMLSerializer: () => new XMLSerializer(),
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: webLoadFont,
		getImageByPath: WebGetImageByPath,
		mermaidExtractText,
		getModulithSearchClient: async ({ cacheFileProvider, articleStorageFileProvider }) =>
			await WebWorkerModulithSearchClient.create({ cacheFileProvider, articleStorageFileProvider }),
		getResourceParseClient: () => Promise.resolve(undefined),
		getPdfjs,
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
