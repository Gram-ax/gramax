/** biome-ignore-all lint/suspicious/noExplicitAny: idc */
import { nextLoadFont } from "@ext/pdfExport/fontLoaders/loadFontBuffer";
import xmldom from "@xmldom/xmldom";
import DocportalCookie from "../../../apps/docportal/server/logic/DocportalCookie";
import { BunResourceParseWorkerClient } from "../../../apps/docportal/server/search/modulith/BunResourceParseWorkerClient";
import { BunWorkerModulithSearchClient } from "../../../apps/docportal/server/search/modulith/BunWorkerModulithSearchClient";
import NextGetImageByPath from "../../../apps/next/logic/NextGetImageByPath";
import NextGetImageFromDom from "../../../apps/next/logic/NextGetImageFromDom";
import NextGetImageSizeFromImageData from "../../../apps/next/logic/NextGetImageSizeFromImageData";
import NextSvgToPng from "../../../apps/next/logic/NextSvgToPng";
import { mermaidExtractText } from "../../../apps/next/mermaid/mermaidExtractText";
import { getPdfjs } from "../../../apps/next/pdfjs/getPdfjs";
import type { BackendDynamicModules } from "..";

export const getDocportalModules = (): Promise<BackendDynamicModules> => {
	return Promise.resolve({
		Cookie: DocportalCookie,
		initWasm: () => Promise.resolve(),
		svgToPng: NextSvgToPng,
		getImageSizeFromImageData: NextGetImageSizeFromImageData,
		getImageFromDom: NextGetImageFromDom,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new xmldom.DOMParser() as any,
		getXMLSerializer: () => new xmldom.XMLSerializer() as any,
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: nextLoadFont(),
		getImageByPath: NextGetImageByPath,
		mermaidExtractText,
		getModulithSearchClient: async ({ cacheFileProvider, articleStorageFileProvider }) =>
			await BunWorkerModulithSearchClient.create({ cacheFileProvider, articleStorageFileProvider }),
		getResourceParseClient: async () => await BunResourceParseWorkerClient.create(),
		getPdfjs,
	});
};

let modules: BackendDynamicModules | null = null;

export const initBackendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getDocportalModules();
};

const resolveBackendModule = <K extends keyof BackendDynamicModules>(name: K): BackendDynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveBackendModule;
