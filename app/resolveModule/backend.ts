import { getExecutingEnvironment } from "@app/resolveModule/env";
import type {
	GetImageByPathOptions,
	GetImageByPathResult,
} from "@ext/markdown/elements/image/export/NextImageProcessor";
import type { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import type BrowserCookie from "apps/browser/src/logic/BrowserCookie";
import type NextCookie from "apps/next/logic/NextCookie";
import type TauriCookie from "apps/tauri/src/cookie/TauriCookie";

interface DynamicModules {
	Cookie: typeof BrowserCookie | typeof TauriCookie | typeof NextCookie;
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

let modules: DynamicModules = null;
let init: Promise<void> | null = null;

export const initModules = async (): Promise<void> => {
	if (init as any) return init;

	init = (async () => {
		const env = getExecutingEnvironment();

		switch (env) {
			case "browser":
				{
					const mod = await import("./backend/browser");
					modules = await mod.getBrowserModules();
				}
				break;

			case "next":
				{
					const mod = await import("./backend/next");
					modules = await mod.getNextModules();
				}
				break;

			case "tauri":
				{
					const mod = await import("./backend/tauri");
					modules = await mod.getTauriModules();
				}
				break;

			case "test":
				{
					const mod = await import("./backend/test");
					modules = await mod.getTestModules();
				}
				break;

			case "static":
				{
					const mod = await import("./backend/static");
					modules = await mod.getStaticModules();
				}
				break;

			case "cli":
				{
					const mod = await import("./backend/cli");
					modules = await mod.getCliModules();
				}
				break;

			default:
				throw new Error(`unsupported environment: ${env}`);
		}
	})();

	return init;
};

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error("module " + name + " not found");
	return module;
};

export default resolveModule;
