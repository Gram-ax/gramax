/** biome-ignore-all lint/suspicious/noExplicitAny: idc */

import DiffFileInputCdn from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputCdn";
import FileInputCdn from "@components/Atoms/FileInput/FileInputCdn";
import type Url from "@core-ui/ApiServices/Types/Url";
import LanguageServiceModule from "@core-ui/ContextServices/Language";
import LocalizerModule from "@ext/localization/core/Localizer";
import NextLink from "../../../apps/next/components/Atoms/Link";
import NextRouter from "../../../apps/next/logic/Api/NextRouter";
import useUrlImage from "../../../core/components/Atoms/Image/useUrlImage";
import type { DynamicModules } from "..";

const getNextModules = async (): Promise<DynamicModules> => {
	return {
		Link: NextLink,
		Router: NextRouter,
		Fetcher: async (
			url: Url,
			body?: BodyInit,
			mime?: any,
			method?: any,
			_notifyError?: any,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			_onDidCommand?: (command: string, args: object, result: unknown) => void,
			signal?: AbortSignal,
		) => {
			let pathname = "";
			if (typeof window !== "undefined") {
				if (!url?.basePath) pathname = window.location.pathname;
				else pathname = window.location.pathname.replace(url.basePath, "");
			}
			const l = LocalizerModule.extract(pathname);
			const headers = {
				"Content-Type": mime,
				"x-gramax-ui-language": LanguageServiceModule.currentUi(),
				"x-gramax-language": l,
			};

			const res = (await fetch(
				url.toString(),
				body
					? {
							method,
							body,
							headers,
							signal,
						}
					: { headers, signal },
			)) as any;
			res.buffer = async () => Buffer.from(await res.arrayBuffer());
			return res;
		},
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
	};
};

export { getNextModules };

let modules: DynamicModules | null = null;

export const initFrontendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getNextModules();
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
