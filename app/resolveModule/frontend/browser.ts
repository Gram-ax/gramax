import BrowserLazyDiffFileInput from "@components/Atoms/FileInput/DiffFileInput/LazyDiffFileInput";
import BrowserLazyFileInput from "@components/Atoms/FileInput/LazyFileInput";
import BrowserLink from "../../../apps/browser/src/components/Atoms/Link";
import useUrlObjectImage from "../../../apps/browser/src/hooks/useUrlObjectImage";
import BrowserFetchService from "../../../apps/browser/src/logic/Api/BrowserFetchService";
import BrowserRouter from "../../../apps/browser/src/logic/Api/BrowserRouter";
import type { DynamicModules } from "..";

export const getBrowserModules = async (): Promise<DynamicModules> => {
	return {
		Link: BrowserLink,
		Router: BrowserRouter,
		Fetcher: BrowserFetchService,
		useImage: useUrlObjectImage,
		openChildWindow: (params) => window.open(params.url, params.name, params.features),
		enterpriseLogin: () => Promise.resolve(null),
		openDirectory: () => "",
		FileInput: BrowserLazyFileInput,
		DiffFileInput: BrowserLazyDiffFileInput,
		httpFetch: () => undefined,
		setBadge: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
		openInWeb: (url) => window.open(url),
	};
};

let modules: DynamicModules | null = null;

export const initFrontendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getBrowserModules();
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
