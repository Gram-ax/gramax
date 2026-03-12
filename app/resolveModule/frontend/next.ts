/** biome-ignore-all lint/suspicious/noExplicitAny: idc */

import DiffFileInputCdn from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputCdn";
import FileInputCdn from "@components/Atoms/FileInput/FileInputCdn";
import { getPdfjs } from "../../../apps/browser/src/pdfjs/getPdfjs";
import NextLink from "../../../apps/next/components/Atoms/Link";
import NextFetcher from "../../../apps/next/logic/Api/NextFetcher";
import NextRouter from "../../../apps/next/logic/Api/NextRouter";
import useUrlImage from "../../../core/components/Atoms/Image/useUrlImage";
import type { DynamicModules } from "..";

const getNextModules = (): DynamicModules => {
	return {
		Link: NextLink,
		Router: NextRouter,
		Fetcher: async (url, body, mime, method, _notifyError, _onDidCommand, signal) =>
			NextFetcher(url, body, mime, method, signal),
		useImage: useUrlImage,
		enterpriseLogin: () => Promise.resolve(null),
		openChildWindow: (params) =>
			typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
		openDirectory: () => "",
		FileInput: FileInputCdn,
		DiffFileInput: DiffFileInputCdn,
		httpFetch: () => undefined,
		setBadge: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
		openInWeb: (url: string) => (typeof window === "undefined" ? undefined : window.open(url)),
		getPdfjs,
	};
};

export { getNextModules };

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getNextModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
