/** biome-ignore-all lint/suspicious/noExplicitAny: idc */

import DiffFileInputCdn from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputCdn";
import FileInputCdn from "@components/Atoms/FileInput/FileInputCdn";
import LanguageServiceModule from "@core-ui/ContextServices/Language";
import LocalizerModule from "@ext/localization/core/Localizer";
import NextLink from "../../../apps/next/components/Atoms/Link";
import NextRouter from "../../../apps/next/logic/Api/NextRouter";
import { getPdfjs } from "../../../apps/next/pdfjs/getPdfjs";
import useUrlImage from "../../../core/components/Atoms/Image/useUrlImage";
import type { DynamicModules } from "..";

const getTestModules = (): DynamicModules => {
	return {
		Link: NextLink,
		Router: NextRouter,
		Fetcher: async (
			url: any,
			body?: BodyInit,
			mime?: any,
			method?: any,
			_notifyError?: any,
			_onDidCommand?: (command: string, args: object, result: unknown) => void,
			signal?: AbortSignal,
		) => {
			const l = LocalizerModule.extract(window.location.pathname);
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
		openInWeb: () => undefined,
		getPdfjs,
	};
};

export { getTestModules };

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getTestModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
