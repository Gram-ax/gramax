import WebLazyDiffFileInput from "@components/Atoms/FileInput/DiffFileInput/LazyDiffFileInput";
import WebLazyFileInput from "@components/Atoms/FileInput/LazyFileInput";
import WebLink from "../../../apps/web/src/components/Atoms/Link";
import useUrlObjectImage from "../../../apps/web/src/hooks/useUrlObjectImage";
import getWebFetchService from "../../../apps/web/src/logic/Api/getWebFetchService";
import WebRouter from "../../../apps/web/src/logic/Api/WebRouter";
import { getPdfjs } from "../../../apps/web/src/pdfjs/getPdfjs";
import type { DynamicModules } from "..";

export const getWebModules = (): DynamicModules => {
	return {
		Link: WebLink,
		Router: WebRouter,
		Fetcher: getWebFetchService(),
		useImage: useUrlObjectImage,
		openChildWindow: (params) => window.open(params.url, params.name, params.features),
		enterpriseLogin: () => Promise.resolve(null),
		openDirectory: () => "",
		FileInput: WebLazyFileInput,
		DiffFileInput: WebLazyDiffFileInput,
		httpFetch: () => undefined,
		setBadge: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
		gesCloudLogin: () => undefined,
		openInWeb: (url) => window.open(url),
		getPdfjs,
		updateCheck: () => undefined,
		updateInstallFromCache: () => undefined,
		updateAccept: () => undefined,
	};
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getWebModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
