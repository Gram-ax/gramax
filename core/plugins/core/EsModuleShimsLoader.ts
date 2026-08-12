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

// es-module-shims is vendored under core/public/plugins and served same-origin (next to sdk.js).
// A cross-origin CDN <script> is blocked by the app's COEP: require-corp policy
// (SharedArrayBuffer/wasm threads) and is unreachable behind an authenticating proxy / offline;
// same-origin sidesteps all of that.
const ES_MODULE_SHIM_PATH = "/plugins/es-module-shims.js";
const isWebRuntime = typeof window !== "undefined" && typeof document !== "undefined";

interface ImportShimWindow extends Window {
	importShim?: (url: string) => Promise<{ default?: unknown }>;
}

const getImportShim = () => (window as ImportShimWindow).importShim;

function getSdkPath(): string {
	const isWebDev = getExecutingEnvironment() === "web" && process.env.NODE_ENV === "development";
	if (isWebDev) return SDK_PATH_VITE_DEV;

	if (isWebRuntime && getExecutingEnvironment() === "tauri") {
		return new URL(SDK_PATH, window.location.href).href;
	}

	return SDK_PATH;
}

function getShimUrl(): string {
	// Tauri serves from a custom protocol origin, so resolve against the document to keep it absolute.
	if (isWebRuntime && getExecutingEnvironment() === "tauri") {
		return new URL(ES_MODULE_SHIM_PATH, window.location.href).href;
	}

	return ES_MODULE_SHIM_PATH;
}

function createImportMap(): Record<string, string> {
	const sdkPath = getSdkPath();
	return Object.fromEntries(GRAMAX_MODULES.map((mod) => [mod, sdkPath]));
}

export class EsModuleShimsLoader {
	private get isLoaded(): boolean {
		if (!isWebRuntime) return true;
		const hasImportMap = !!document.head.querySelector('script[type="importmap-shim"]');
		const hasShimScript = !!document.head.querySelector('script[src*="es-module-shims"]');
		const hasImportShim = typeof getImportShim() === "function";
		return hasImportMap && hasShimScript && hasImportShim;
	}

	async load(): Promise<void> {
		if (!isWebRuntime) {
			return;
		}

		if (this.isLoaded) {
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
			shimScript.src = getShimUrl();
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

	async importModule<T = unknown>(scriptUrl: string): Promise<T> {
		if (!isWebRuntime) {
			const module = await import(/* webpackIgnore: true */ scriptUrl);
			assert(module?.default, `Plugin module at ${scriptUrl} does not export a default class`);
			return module.default as T;
		}

		const importShim = getImportShim();
		assert(importShim, "es-module-shims importShim is not available");
		const module = await importShim(scriptUrl);
		assert(module?.default, `Plugin module at ${scriptUrl} does not export a default class`);
		return module.default as T;
	}
}
