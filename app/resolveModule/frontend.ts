import type FileInput from "@components/Atoms/FileInput/FileInputProps";
import type Link from "../../core/components/Atoms/Link";
import type FetchService from "../../core/ui-logic/ApiServices/FetchService";

interface DynamicModules {
	Link: typeof Link;
	Router: typeof BrowserRouter | typeof NextRouter;
	Fetcher: typeof FetchService.fetch;
	useImage: typeof useUrlImage;
	FileInput: FileInput;
	openDirectory: () => string | Promise<string>;

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
import BrowserLazyFileInput from "@components/Atoms/FileInput/LazyFileInput";
import BrowserLink from "../../apps/browser/src/components/Atoms/Link";
import useUrlObjectImage from "../../apps/browser/src/hooks/useUrlObjectImage";
import BrowserFetchService from "../../apps/browser/src/logic/Api/BrowserFetchService";
import BrowserRouter from "../../apps/browser/src/logic/Api/BrowserRouter";

modules = {
	Link: BrowserLink,
	Router: BrowserRouter,
	Fetcher: BrowserFetchService,
	useImage: useUrlObjectImage,
	openChildWindow: (params) => window.open(params.url, params.name, params.features),
	openDirectory: () => "",
	FileInput: BrowserLazyFileInput,
};

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT=next
import FileInputCdn from "@components/Atoms/FileInput/FileInputCdn";
import LanguageService from "@core-ui/ContextServices/Language";
import NextLink from "../../apps/next/components/Atoms/Link";
import NextRouter from "../../apps/next/logic/Api/NextRouter";
import useUrlImage from "../../core/components/Atoms/Image/useUrlImage";
import Method from "../../core/ui-logic/ApiServices/Types/Method";
import MimeTypes from "../../core/ui-logic/ApiServices/Types/MimeTypes";
import Url from "../../core/ui-logic/ApiServices/Types/Url";

modules = {
	Link: NextLink,
	Router: NextRouter,
	Fetcher: async <T = any>(url: Url, body?: BodyInit, mime?: MimeTypes, method?: Method) => {
		const res = (await fetch(
			url.toString(),
			body
				? {
						method,
						body,
						headers: { "Content-type": mime, "x-gramax-ui-language": LanguageService.currentUi() },
				  }
				: { headers: { "x-gramax-ui-language": LanguageService.currentUi() } },
		)) as FetchResponse<T>;
		res.buffer = async () => Buffer.from(await res.arrayBuffer());
		return res;
	},

	useImage: useUrlImage,
	openChildWindow: (params) =>
		typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
	openDirectory: () => "",
	FileInput: FileInputCdn,
};

// #v-endif
/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "jest"
// #v-ifdef VITE_ENVIRONMENT=jest
import FileInputCdnJest from "@components/Atoms/FileInput/FileInputCdn";
import NextLinkJest from "../../apps/next/components/Atoms/Link";
import NextRouterJest from "../../apps/next/logic/Api/NextRouter";
import useUrlImageJest from "../../core/components/Atoms/Image/useUrlImage";
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
	openDirectory: () => "",
	FileInput: FileInputCdnJest,
};

// #v-endif
/// #endif

/// #if VITE_ENVIRONMENT == "tauri"
// #v-ifdef VITE_ENVIRONMENT=tauri
import LazyFileInputTauri from "@components/Atoms/FileInput/LazyFileInput";
import FetchResponse from "@core-ui/ApiServices/Types/FetchResponse";
import TauriLink from "../../apps/browser/src/components/Atoms/Link";
import useUrlObjectImage2 from "../../apps/browser/src/hooks/useUrlObjectImage";
import TauriFetcher from "../../apps/browser/src/logic/Api/BrowserFetchService";
import TauriRouter from "../../apps/browser/src/logic/Api/BrowserRouter";
import { openChildWindow, openDirectory } from "../../apps/tauri/src/window/commands";

modules = {
	Link: TauriLink,
	Router: TauriRouter,
	useImage: useUrlObjectImage2,
	Fetcher: TauriFetcher,
	openChildWindow,
	FileInput: LazyFileInputTauri,
	openDirectory,
};

// #v-endif
/// #endif

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules[name];
	if (!module) throw new Error("Module " + name + " not found");
	return module;
};

export default resolveModule;
