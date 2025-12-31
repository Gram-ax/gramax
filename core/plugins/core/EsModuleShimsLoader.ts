import { getExecutingEnvironment } from "@app/resolveModule/env";
import assert from "assert";

const GRAMAX_MODULES = [
	"@gramax/sdk",
	"@gramax/sdk/ui",
	"@gramax/sdk/editor",
	"@gramax/sdk/events",
	"@gramax/sdk/localization",
	"@gramax/sdk/utilities",
	"@gramax/sdk/metrics",
] as const;

const SDK_PATH = "/plugins/sdk.js";
const SDK_PATH_VITE_DEV = "/@id/@plugins/api/sdk/index";

const ES_MODULE_SHIM_URL = "https://ga.jspm.io/npm:es-module-shims@2.6.2/dist/es-module-shims.js";

function getSdkPath(): string {
	const isBrowserDev = getExecutingEnvironment() === "browser" && process.env.NODE_ENV === "development";
	return isBrowserDev ? SDK_PATH_VITE_DEV : SDK_PATH;
}

function createImportMap(): Record<string, string> {
	const sdkPath = getSdkPath();
	return Object.fromEntries(GRAMAX_MODULES.map((mod) => [mod, sdkPath]));
}

export class EsModuleShimsLoader {
	private get _isLoaded(): boolean {
		return (
			!!document.head.querySelector('script[type="importmap-shim"]') &&
			!!document.head.querySelector('script[src*="es-module-shims"]')
		);
	}

	async load(): Promise<void> {
		if (this._isLoaded) {
			return;
		}

		return new Promise((resolve, reject) => {
			const importMap = document.createElement("script");
			importMap.type = "importmap-shim";
			importMap.textContent = JSON.stringify({
				imports: createImportMap(),
			});
			document.head.appendChild(importMap);

			const shimScript = document.createElement("script");
			shimScript.async = true;
			shimScript.src = ES_MODULE_SHIM_URL;
			shimScript.onload = () => {
				resolve();
			};
			shimScript.onerror = () => {
				document.head.removeChild(importMap);
				reject(new Error("Failed to load es-module-shims"));
			};
			document.head.appendChild(shimScript);
		});
	}

	async importModule<T = any>(scriptUrl: string): Promise<T> {
		const module = await (window as any).importShim(scriptUrl);
		assert(module?.default, `Plugin module at ${scriptUrl} does not export a default class`);
		return module.default;
	}
}
