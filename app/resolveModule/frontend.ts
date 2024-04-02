import type { FileInput } from "@components/Atoms/FileInput/FileInput";
import type Link from "../../core/components/Atoms/Link";
import type FetchService from "../../core/ui-logic/ApiServices/FetchService";

interface DynamicModules {
	Link: typeof Link;
	Router: typeof BrowserRouter | typeof NextRouter;
	Fetcher: typeof FetchService.fetch;
	useImage: typeof useUrlImage;
	FileInput: typeof FileInput;

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
}

let modules: DynamicModules;

/// #if VITE_ENVIRONMENT == "browser"
// #v-ifdef VITE_ENVIRONMENT=browser
import { FileInput as FileInputBrowser } from "@components/Atoms/FileInput/FileInput";
import BrowserLink from "../../apps/browser/src/components/Atoms/Link";
import useBase64Image from "../../apps/browser/src/hooks/useBase64Image";
import BrowserFetchService from "../../apps/browser/src/logic/Api/BrowserFetchService";
import BrowserRouter from "../../apps/browser/src/logic/Api/BrowserRouter";

modules = {
	Link: BrowserLink,
	Router: BrowserRouter,
	Fetcher: BrowserFetchService,
	useImage: useBase64Image,
	openChildWindow: (params) => window.open(params.url, params.name, params.features),
	FileInput: FileInputBrowser,
};

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT=next
import { FileInput as FileInputNext } from "@components/Atoms/FileInput/FileInput";
import NextLink from "../../apps/next/components/Atoms/Link";
import NextRouter from "../../apps/next/logic/Api/NextRouter";
import useUrlImage from "../../core/components/Atoms/Image/useImage";
import Method from "../../core/ui-logic/ApiServices/Types/Method";
import MimeTypes from "../../core/ui-logic/ApiServices/Types/MimeTypes";
import Url from "../../core/ui-logic/ApiServices/Types/Url";

modules = {
	Link: NextLink,
	Router: NextRouter,
	Fetcher: <T = any>(url: Url, body?: BodyInit, mime?: MimeTypes, method?: Method) =>
		fetch(url.toString(), body ? { method, body, headers: { "Content-type": mime } } : null) as Promise<T>,
	useImage: useUrlImage,
	openChildWindow: (params) =>
		typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
	FileInput: FileInputNext,
};

// #v-endif
/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "jest"
// #v-ifdef VITE_ENVIRONMENT=jest
import { FileInput as FileInputNextJest } from "@components/Atoms/FileInput/FileInput";
import NextLinkJest from "../../apps/next/components/Atoms/Link";
import NextRouterJest from "../../apps/next/logic/Api/NextRouter";
import useUrlImageJest from "../../core/components/Atoms/Image/useImage";
import MethodJest from "../../core/ui-logic/ApiServices/Types/Method";
import MimeTypesJest from "../../core/ui-logic/ApiServices/Types/MimeTypes";
import UrlJest from "../../core/ui-logic/ApiServices/Types/Url";

modules = {
	Link: NextLinkJest,
	Router: NextRouterJest,
	Fetcher: <T = any>(url: UrlJest, body?: BodyInit, mime?: MimeTypesJest, method?: MethodJest) =>
		fetch(url.toString(), body ? { method, body, headers: { "Content-type": mime } } : null) as Promise<T>,
	useImage: useUrlImageJest,
	openChildWindow: (params) =>
		typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
	FileInput: FileInputNextJest,
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT=tauri
import FileInputTauri from "@components/Atoms/FileInput/FileInputTauri";
import TauriLink from "../../apps/browser/src/components/Atoms/Link";
import useBase64Image2 from "../../apps/browser/src/hooks/useBase64Image";
import TauriFetcher from "../../apps/browser/src/logic/Api/BrowserFetchService";
import TauriRouter from "../../apps/browser/src/logic/Api/BrowserRouter";
import openChildWindow from "../../apps/tauri/src/window/openChildWindow";

modules = {
	Link: TauriLink,
	Router: TauriRouter,
	useImage: useBase64Image2,
	Fetcher: TauriFetcher,
	openChildWindow,
	FileInput: FileInputTauri,
};

// #v-endif
/// #endif

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules[name];
	if (!module) throw new Error("Module " + name + " not found");
	return module;
};

export default resolveModule;
