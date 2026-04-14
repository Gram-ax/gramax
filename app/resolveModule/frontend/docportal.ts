import { getPdfjs } from "../../../apps/browser/src/pdfjs/getPdfjs";
import DocportalFetcher from "../../../apps/docportal/client/logic/DocportalFetcher";
import DocportalRouter from "../../../apps/docportal/client/logic/DocportalRouter";
import Link from "../../../apps/gramax-cli/src/Components/Atoms/Link";
import useUrlImage from "../../../core/components/Atoms/Image/useUrlImage";
import type { DynamicModules } from "..";

export const getDocportalModules = (): DynamicModules => {
	return {
		Link: Link,
		Router: DocportalRouter,
		Fetcher: DocportalFetcher,
		useImage: useUrlImage,
		enterpriseLogin: () => Promise.resolve(null),
		openChildWindow: (params) =>
			typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
		openDirectory: () => "",
		FileInput: () => null,
		DiffFileInput: () => null,
		httpFetch: () => undefined,
		setBadge: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
		openInWeb: () => undefined,
		getPdfjs,
	};
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getDocportalModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
