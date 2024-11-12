import type FileInput from "@components/Atoms/FileInput/FileInputProps";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type { Router } from "@core/Api/Router";
import type Link from "../../core/components/Atoms/Link";
import type FetchService from "../../core/ui-logic/ApiServices/FetchService";

interface DynamicModules {
	Link: typeof Link;
	Router: typeof BrowserRouter | typeof NextRouter;
	Fetcher: typeof FetchService.fetch;
	useImage: typeof useUrlImage;
	FileInput: FileInput;
	openDirectory: () => string | Promise<string>;
	enterpriseLogin: (url: string, apiUrlCreator: ApiUrlCreator, router: Router) => Promise<void>;
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
	httpFetch: typeof httpFetch;
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
	enterpriseLogin: () => null,
	openDirectory: () => "",
	FileInput: BrowserLazyFileInput,
	httpFetch: () => undefined,
};

/// #endif
// #v-endif

/// #if VITE_ENVIRONMENT == "next"
// #v-ifdef VITE_ENVIRONMENT=next
import FileInputCdn from "@components/Atoms/FileInput/FileInputCdn";
import LanguageService from "@core-ui/ContextServices/Language";
import Localizer from "@ext/localization/core/Localizer";
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
		const l = Localizer.extract(window.location.pathname);
		const headers = {
			"x-gramax-ui-language": LanguageService.currentUi(),
			"x-gramax-language": l,
		};

		const res = (await fetch(
			url.toString(),
			body
				? {
						method,
						body,
						headers: {
							"Content-type": mime,
							...headers,
						},
				  }
				: { headers },
		)) as FetchResponse<T>;
		res.buffer = async () => Buffer.from(await res.arrayBuffer());
		return res;
	},

	useImage: useUrlImage,
	enterpriseLogin: () => null,
	openChildWindow: (params) =>
		typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
	openDirectory: () => "",
	FileInput: FileInputCdn,
	httpFetch: () => undefined,
};

// #v-endif
/// #endif

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
	enterpriseLogin: () => null,
	openChildWindow: (params) =>
		typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
	openDirectory: () => "",
	FileInput: FileInputCdnJest,
	httpFetch: () => undefined,
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
import { httpFetch, openChildWindow, openDirectory } from "../../apps/tauri/src/window/commands";
import enterpriseLogin from "../../apps/tauri/src/window/enterpriseLogin";

modules = {
	Link: TauriLink,
	Router: TauriRouter,
	useImage: useUrlObjectImage2,
	Fetcher: TauriFetcher,
	openChildWindow,
	enterpriseLogin,
	FileInput: LazyFileInputTauri,
	openDirectory,
	httpFetch,
};

// #v-endif
/// #endif

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules[name];
	if (!module) throw new Error("Module " + name + " not found");
	return module;
};

export default resolveModule;
