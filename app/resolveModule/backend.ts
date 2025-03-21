interface DynamicModules {
	Cookie: typeof BrowserCookie | typeof NextCookie;
	initWasm: (corsProxy: string) => Promise<void>;
	svgToPng: (svg: string, size: ImageDimensions, scale: number) => Promise<Buffer>;
	getImageSizeFromImageData: (imageBuffer: Buffer, maxWidth?: number, maxHeight?: number) => Promise<ImageDimensions>;
	getImageFromDom: (tag: string, fitContent: boolean) => Promise<Buffer>;
	moveToTrash: (path: string) => Promise<void>;
	getDOMParser: () => DOMParser;
	setSessionData: (key: string, data: string) => Promise<void>;
	pdfLoadFont: (fontPath: string) => Promise<ArrayBuffer>;
	getImageByPath: (options: GetImageByPathOptions) => Promise<GetImageByPathResult>;
}

let modules: DynamicModules;

/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT='browser'
import BrowserCookie from "../../apps/browser/src/logic/BrowserCookie";
import BrowserSvgToPng from "../../apps/browser/src/logic/BrowserSvgToPng";
import BrowserGetImageSizeFromImageData from "../../apps/browser/src/logic/BrowserGetImageSizeFromImageData";
import BrowserGetImageFromDom from "../../apps/browser/src/logic/BrowserGetImageFromDom";
import { initWasm } from "../../apps/browser/wasm/js/wasm";
import { browserLoadFont } from "@ext/pdfExport/fontLoaders/browserLoadFont";
import { getImageByPath as BrowserGetImageByPath } from "../../apps/browser/src/logic/BrowserGetImageByPath";

modules = {
	Cookie: BrowserCookie,
	initWasm: initWasm,
	svgToPng: BrowserSvgToPng,
	getImageSizeFromImageData: BrowserGetImageSizeFromImageData,
	getImageFromDom: BrowserGetImageFromDom,
	moveToTrash: () => Promise.resolve(),
	getDOMParser: () => new DOMParser(),
	setSessionData: () => Promise.resolve(),
	pdfLoadFont: browserLoadFont,
	getImageByPath: BrowserGetImageByPath,
};

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT='next'
import NextCookie from "../../apps/next/logic/NextCookie";
import NextSvgToPng from "../../apps/next/logic/NextSvgToPng";
import NextGetImageSizeFromImageData from "../../apps/next/logic/NextGetImageSizeFromImageData";
import NextGetImageFromDom from "../../apps/next/logic/NextGetImageFromDom";
import { DOMParser as NextDOMParser } from "@xmldom/xmldom";
import { loadFontBuffer } from "@ext/pdfExport/fontLoaders/nextLoadFont";
import { getImageByPath as NextGetImageByPath } from "../../apps/next/logic/NextGetImageByPath";

modules = {
	Cookie: NextCookie,
	initWasm: () => Promise.resolve(),
	svgToPng: NextSvgToPng,
	getImageSizeFromImageData: NextGetImageSizeFromImageData,
	getImageFromDom: NextGetImageFromDom,
	moveToTrash: () => Promise.resolve(),
	getDOMParser: () => new NextDOMParser() as any,
	setSessionData: () => Promise.resolve(),
	pdfLoadFont: loadFontBuffer,
	getImageByPath: NextGetImageByPath,
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT='tauri'
import TauriCookie from "../../apps/browser/src/logic/BrowserCookie";
import TauriSvgToPng from "../../apps/browser/src/logic/BrowserSvgToPng";
import TauriGetImageSizeFromImageData from "../../apps/browser/src/logic/BrowserGetImageSizeFromImageData";
import TauriGetImageFromDom from "../../apps/browser/src/logic/BrowserGetImageFromDom";
import { moveToTrash, setSessionData } from "../../apps/tauri/src/window/commands";
import { browserLoadFont as tauriLoadFont } from "@ext/pdfExport/fontLoaders/browserLoadFont";
import { getImageByPath as TauriGetImageByPath } from "../../apps/browser/src/logic/BrowserGetImageByPath";

modules = {
	Cookie: TauriCookie,
	initWasm: () => Promise.resolve(),
	svgToPng: TauriSvgToPng,
	getImageSizeFromImageData: TauriGetImageSizeFromImageData,
	getImageFromDom: TauriGetImageFromDom,
	moveToTrash: moveToTrash,
	getDOMParser: () => new DOMParser(),
	setSessionData: setSessionData,
	pdfLoadFont: tauriLoadFont,
	getImageByPath: TauriGetImageByPath,
};

// #v-endif;
/// #endif

/// #if VITE_ENVIRONMENT == "jest"
// #v-ifdef VITE_ENVIRONMENT='jest'
import JestCookie from "../../apps/browser/src/logic/BrowserCookie";
import JestSvgToPng from "../../apps/next/logic/NextSvgToPng";
import JestGetImageSizeFromImageData from "../../apps/next/logic/NextGetImageSizeFromImageData";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import JestGetImageFromDom from "../../apps/next/logic/NextGetImageFromDom";
import { DOMParser as JestDOMParser } from "@xmldom/xmldom";
import { GetImageByPathOptions, GetImageByPathResult } from "@ext/markdown/elements/image/export/NextImageProcessor";
import { getImageByPath as JestGetImageByPath } from "../../apps/next/logic/NextGetImageByPath";

modules = {
	Cookie: JestCookie,
	initWasm: () => Promise.resolve(),
	svgToPng: JestSvgToPng,
	getImageSizeFromImageData: JestGetImageSizeFromImageData,
	getImageFromDom: JestGetImageFromDom,
	moveToTrash: () => Promise.resolve(),
	getDOMParser: () => new JestDOMParser() as any,
	setSessionData: () => Promise.resolve(),
	pdfLoadFont: () => Promise.resolve(new ArrayBuffer(0)),
	getImageByPath: JestGetImageByPath,
};

// #v-endif;
/// #endif

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules[name];
	if (!module) throw new Error("Module " + name + " not found");
	return module;
};

export default resolveModule;
