import { FileInput } from "@components/Atoms/FileInput/FileInput";
import Link from "../core/components/Atoms/Link";
import FetchService from "../core/ui-logic/ApiServices/FetchService";
import { EnvironmentVariable, defaultVariables } from "./config/env";
import viteEnv from "./config/viteenv";

type Environment = "next" | "tauri" | "browser";

interface DynamicModules {
	Link: typeof Link;
	Cookie: typeof BrowserCookie | typeof NextCookie;
	Router: typeof BrowserRouter | typeof NextRouter;
	Fetcher: typeof FetchService.fetch;
	useImage: typeof useUrlImage;
	FileProvider?: typeof BrowserFileProvider | typeof DiskFileProvider;
	openChildWindow: ({
		url,
		redirect,
		name,
		features,
	}: {
		url: string;
		redirect?: string;
		name?: string;
		features?: string;
	}) => Promise<Window> | Window;
	GitCommandsImpl: typeof IsomorphicGitCommands | typeof TauriGitCommands;
	FileInput: typeof FileInput;
}

let modules: DynamicModules;
let executing: Environment;
let _env: (name: keyof EnvironmentVariable) => string;

/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT=browser
import { FileInput as FileInputBrowser } from "@components/Atoms/FileInput/FileInput";
import IsomorphicGitCommands from "../core/extensions/git/core/GitCommands/Isomorphic/IsomorphicGitCommands";
import BrowserLink from "../target/browser/src/components/Atoms/Link";
import useBase64Image from "../target/browser/src/hooks/useBase64Image";
import BrowserFetchService from "../target/browser/src/logic/Api/BrowserFetchService";
import BrowserRouter from "../target/browser/src/logic/Api/BrowserRouter";
import BrowserCookie from "../target/browser/src/logic/BrowserCookie";
import { BrowserFileProvider } from "../target/browser/src/logic/FileProvider/BrowserFileProvider";

modules = {
	Link: BrowserLink,
	Cookie: BrowserCookie,
	Router: BrowserRouter,
	Fetcher: BrowserFetchService,
	useImage: useBase64Image,
	FileProvider: BrowserFileProvider,
	openChildWindow: (params) => window.open(params.url, params.name, params.features),
	GitCommandsImpl: IsomorphicGitCommands,
	FileInput: FileInputBrowser,
};

executing = "browser";

_env = () => undefined;

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT=next
import { FileInput as FileInputNext } from "@components/Atoms/FileInput/FileInput";
import useUrlImage from "../core/components/Atoms/Image/useImage";
import IsomorphicRepository2 from "../core/extensions/git/core/GitCommands/Isomorphic/IsomorphicGitCommands";
import Method from "../core/ui-logic/ApiServices/Types/Method";
import MimeTypes from "../core/ui-logic/ApiServices/Types/MimeTypes";
import Url from "../core/ui-logic/ApiServices/Types/Url";
import NextLink from "../target/next/components/Atoms/Link";
import NextRouter from "../target/next/logic/Api/NextRouter";
import NextCookie from "../target/next/logic/NextCookie";

modules = {
	Link: NextLink,
	Cookie: NextCookie,
	Router: NextRouter,
	Fetcher: <T = any>(url: Url, body?: BodyInit, mime?: MimeTypes, method?: Method) =>
		fetch(url.toString(), body ? { method, body, headers: { "Content-type": mime } } : null) as Promise<T>,
	useImage: useUrlImage,
	openChildWindow: (params) =>
		typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
	GitCommandsImpl: IsomorphicRepository2,
	FileInput: FileInputNext,
};

executing = "next";

_env = (name) => {
	return process.env[name];
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT=tauri
import FileInputTauri from "@components/Atoms/FileInput/FileInputTauri";
import TauriGitCommands from "../core/extensions/git/core/GitCommands/Tauri/TauriGitCommands";
import DiskFileProvider from "../core/logic/FileProvider/DiskFileProvider/DiskFileProvider";
import TauriLink from "../target/browser/src/components/Atoms/Link";
import useBase64Image2 from "../target/browser/src/hooks/useBase64Image";
import TauriFetcher from "../target/browser/src/logic/Api/BrowserFetchService";
import TauriRouter from "../target/browser/src/logic/Api/BrowserRouter";
import TauriCookie from "../target/browser/src/logic/BrowserCookie";
import openChildWindow from "../target/tauri/src/window/openChildWindow";

modules = {
	Link: TauriLink,
	Cookie: TauriCookie,
	Router: TauriRouter,
	useImage: useBase64Image2,
	Fetcher: TauriFetcher,
	FileProvider: DiskFileProvider,
	openChildWindow,
	GitCommandsImpl: TauriGitCommands,
	FileInput: FileInputTauri,
};

executing = "tauri";

_env = (name) => {
	return window.process?.env?.[name];
};

// #v-endif;
/// #endif

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules[name];
	if (!module) throw new Error("Module " + name + " not found");
	return module;
};

const builtIn = { ...(process as any).builtIn, ...viteEnv };

export const env = <T extends keyof EnvironmentVariable>(name: T): EnvironmentVariable[T] => builtIn?.[name] ?? _env(name) ?? defaultVariables[name];

export const getExecutingEnvironment = (): Environment => executing;

export default resolveModule;
