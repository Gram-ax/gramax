import Link from "../../../apps/gramax-cli/src/Components/Atoms/Link";
import StaticRouter from "../../../apps/gramax-cli/src/logic/api/StaticRouter";
import useUrlImage from "../../../core/components/Atoms/Image/useUrlImage";
import type { DynamicModules } from "..";

export const getCliModules = async (): Promise<DynamicModules> => {
	return {
		Link: Link,
		Router: StaticRouter,
		Fetcher: () => {
			return { ok: true, json: () => Promise.resolve({}) };
		},
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
	};
};

let modules: DynamicModules | null = null;

export const initFrontendModules = async (): Promise<void> => {
	if (modules) return;
	modules = await getCliModules();
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
