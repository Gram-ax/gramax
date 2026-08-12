import WebLink from "../../../apps/cli/src/Components/Atoms/Link";
import StaticRouter from "../../../apps/cli/src/logic/api/StaticRouter";
import useUrlObjectImage from "../../../apps/web/src/hooks/useUrlObjectImage";
import getWebFetchService from "../../../apps/web/src/logic/Api/getWebFetchService";
import { getPdfjs } from "../../../apps/web/src/pdfjs/getPdfjs";
import type { DynamicModules } from "..";

const getPathname = () => {
	const fullPath = window.location.pathname;
	const basePath = new URL(document.baseURI).pathname;

	const relativePath = fullPath.startsWith(basePath) ? fullPath.slice(basePath.length) : fullPath;

	return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
};

export const getStaticModules = (): DynamicModules => {
	return {
		Link: WebLink,
		Router: StaticRouter,
		Fetcher: getWebFetchService(getPathname),
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
		gesCloudLogin: () => undefined,
		openInWeb: (url: string) => (typeof window === "undefined" ? undefined : window.open(url)),
		getPdfjs,
		updateCheck: () => undefined,
		updateInstallFromCache: () => undefined,
		updateAccept: () => undefined,
	};
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getStaticModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
