import type LibGit2Commands from "../../core/extensions/git/core/GitCommands/LibGit2Commands";
import type DiskFileProvider from "../../core/logic/FileProvider/DiskFileProvider/DiskFileProvider";

interface DynamicModules {
	Cookie: typeof BrowserCookie | typeof NextCookie;
	FileProvider: typeof BrowserFileProvider | typeof DiskFileProvider;
	GitCommandsImpl: typeof IsomorphicGitCommands | typeof LibGit2Commands;
}

let modules: DynamicModules;

/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT=browser
import BrowserCookie from "../../apps/browser/src/logic/BrowserCookie";
import { BrowserFileProvider } from "../../apps/browser/src/logic/FileProvider/BrowserFileProvider";
import IsomorphicGitCommands from "../../core/extensions/git/core/GitCommands/Isomorphic/IsomorphicGitCommands";

modules = {
	Cookie: BrowserCookie,
	FileProvider: BrowserFileProvider,
	GitCommandsImpl: IsomorphicGitCommands,
};

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT=next
import NextCookie from "../../apps/next/logic/NextCookie";
import LibGit2CommandsNext from "../../core/extensions/git/core/GitCommands/LibGit2Commands";
import DiskFileProviderNext from "../../core/logic/FileProvider/DiskFileProvider/DiskFileProvider";

modules = {
	Cookie: NextCookie,
	FileProvider: DiskFileProviderNext,
	GitCommandsImpl: LibGit2CommandsNext,
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT=tauri
import TauriCookie from "../../apps/browser/src/logic/BrowserCookie";
import LibGit2CommandsTauri from "../../core/extensions/git/core/GitCommands/LibGit2Commands";
import DiskFileProviderTauri from "../../core/logic/FileProvider/DiskFileProvider/DiskFileProvider";

modules = {
	Cookie: TauriCookie,
	FileProvider: DiskFileProviderTauri,
	GitCommandsImpl: LibGit2CommandsTauri,
};

// #v-endif;
/// #endif

/// #if VITE_ENVIRONMENT == "jest"
// #v-ifdef VITE_ENVIRONMENT=jest
import DiskFileProviderJest from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import JestCookie from "../../apps/browser/src/logic/BrowserCookie";
import LibGit2CommandsJest from "../../core/extensions/git/core/GitCommands/LibGit2Commands";

modules = {
	Cookie: JestCookie,
	FileProvider: DiskFileProviderJest,
	GitCommandsImpl: LibGit2CommandsJest,
};

// #v-endif;
/// #endif

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules[name];
	if (!module) throw new Error("Module " + name + " not found");
	return module;
};

export default resolveModule;
