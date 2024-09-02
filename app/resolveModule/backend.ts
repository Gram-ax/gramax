interface DynamicModules {
	Cookie: typeof BrowserCookie | typeof NextCookie;
	initWasm: (corsProxy: string) => Promise<void>;
	requestDeleteOldConfig: () => Promise<void>;
	moveToTrash: (path: string) => Promise<void>;
}

let modules: DynamicModules;

/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT=browser
import BrowserCookie from "../../apps/browser/src/logic/BrowserCookie";
import { initWasm } from "../../apps/browser/wasm/js/wasm";

modules = {
	Cookie: BrowserCookie,
	initWasm: initWasm,
	requestDeleteOldConfig: () => Promise.resolve(),
	moveToTrash: () => Promise.resolve(),
};

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT=next
import NextCookie from "../../apps/next/logic/NextCookie";

modules = {
	Cookie: NextCookie,
	initWasm: () => Promise.resolve(),
	requestDeleteOldConfig: () => Promise.resolve(),
	moveToTrash: () => Promise.resolve(),
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT=tauri
import TauriCookie from "../../apps/browser/src/logic/BrowserCookie";
import { moveToTrash, requestDeleteOldConfig } from "../../apps/tauri/src/window/commands";

modules = {
	Cookie: TauriCookie,
	initWasm: () => Promise.resolve(),
	requestDeleteOldConfig: requestDeleteOldConfig,
	moveToTrash: moveToTrash,
};

// #v-endif;
/// #endif

/// #if VITE_ENVIRONMENT == "jest"
// #v-ifdef VITE_ENVIRONMENT=jest
import JestCookie from "../../apps/browser/src/logic/BrowserCookie";

modules = {
	Cookie: JestCookie,
	initWasm: () => Promise.resolve(),
	requestDeleteOldConfig: () => Promise.resolve(),
	moveToTrash: () => Promise.resolve(),
};

// #v-endif;
/// #endif

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules[name];
	if (!module) throw new Error("Module " + name + " not found");
	return module;
};

export default resolveModule;
