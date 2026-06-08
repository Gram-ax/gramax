import useUrlObjectImage from "../../../apps/browser/src/hooks/useUrlObjectImage";
import getBrowserFetchService from "../../../apps/browser/src/logic/Api/getBrowserFetchService";
import { getPdfjs } from "../../../apps/browser/src/pdfjs/getPdfjs";
import BrowserLink from "../../../apps/gramax-cli/src/Components/Atoms/Link";
import StaticRouter from "../../../apps/gramax-cli/src/logic/api/StaticRouter";
import type { DynamicModules } from "..";

const getPathname = () => {
	const fullPath = window.location.pathname;
	const basePath = new URL(document.baseURI).pathname;

	const relativePath = fullPath.startsWith(basePath) ? fullPath.slice(basePath.length) : fullPath;

	return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
};

export const getStaticModules = (): DynamicModules => {
	return {
		Link: BrowserLink,
		Router: StaticRouter,
		Fetcher: getBrowserFetchService(getPathname),
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
		getPdfjs,
	};
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getStaticModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
