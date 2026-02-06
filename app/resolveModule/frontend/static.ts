import useUrlObjectImage from "../../../apps/browser/src/hooks/useUrlObjectImage";
import BrowserFetchService from "../../../apps/browser/src/logic/Api/BrowserFetchService";
import BrowserLink from "../../../apps/gramax-cli/src/Components/Atoms/Link";
import StaticRouter from "../../../apps/gramax-cli/src/logic/api/StaticRouter";
import type { DynamicModules } from "..";

export const getStaticModules = async (): Promise<DynamicModules> => {
	return {
		Link: BrowserLink,
		Router: StaticRouter,
		Fetcher: BrowserFetchService,
		useImage: useUrlObjectImage,
		openChildWindow: (params) => window.open(params.url, params.name, params.features),
		enterpriseLogin: () => Promise.resolve(null),
		openDirectory: () => "",
		FileInput: () => null,
		DiffFileInput: () => null,
		httpFetch: () => undefined,
		setBadge: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
		openInWeb: (url: string) => (typeof window === "undefined" ? undefined : window.open(url)),
	};
};

let modules: DynamicModules | null = null;

export const initFrontendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getStaticModules();
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
