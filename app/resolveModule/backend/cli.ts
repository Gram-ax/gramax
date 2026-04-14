/** biome-ignore-all lint/suspicious/noExplicitAny: idc */

import xmldom from "@xmldom/xmldom";
import NextCookie from "../../../apps/next/logic/NextCookie";
import NextGetImageFromDom from "../../../apps/next/logic/NextGetImageFromDom";
import NextGetImageSizeFromImageData from "../../../apps/next/logic/NextGetImageSizeFromImageData";
import NextSvgToPng from "../../../apps/next/logic/NextSvgToPng";
import type { BackendDynamicModules } from "..";
import "@ext/pdfExport/fontLoaders/cliLoadFont";
import { cliLoadFont } from "@ext/pdfExport/fontLoaders/cliLoadFont";
import NextGetImageByPath from "../../../apps/next/logic/NextGetImageByPath";
import { mermaidExtractText } from "../../../apps/next/mermaid/mermaidExtractText";
import { getPdfjs } from "../../../apps/next/pdfjs/getPdfjs";
import { TestWorkerResourceParseClient } from "../../../apps/next/search/modulith/TestResourceParseWorkerClient";
import { TestWorkerModulithSearchClient } from "../../../apps/next/search/modulith/TestWorkerModulithSearchClient";

export const getCliModules = (): Promise<BackendDynamicModules> => {
	return Promise.resolve({
		Cookie: NextCookie,
		initWasm: () => Promise.resolve(),
		svgToPng: NextSvgToPng,
		getImageSizeFromImageData: NextGetImageSizeFromImageData,
		getImageFromDom: NextGetImageFromDom,
		moveToTrash: () => Promise.resolve(),
		getDOMParser: () => new xmldom.DOMParser() as any,
		getXMLSerializer: () => new xmldom.XMLSerializer() as any,
		setSessionData: () => Promise.resolve(),
		pdfLoadFont: cliLoadFont(),
		getImageByPath: NextGetImageByPath,
		mermaidExtractText,
		getModulithSearchClient: async ({ cacheFileProvider, articleStorageFileProvider }) =>
			await TestWorkerModulithSearchClient.create({ cacheFileProvider, articleStorageFileProvider }),
		getResourceParseClient: async () => await TestWorkerResourceParseClient.create(),
		getPdfjs,
	});
};

let modules: BackendDynamicModules | null = null;

export const initBackendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getCliModules();
};

const resolveBackendModule = <K extends keyof BackendDynamicModules>(name: K): BackendDynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveBackendModule;
