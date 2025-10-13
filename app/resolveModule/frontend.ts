import { getExecutingEnvironment } from "@app/resolveModule/env";
import type DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputProps";
import type FileInput from "@components/Atoms/FileInput/FileInputProps";
import type useUrlImage from "@components/Atoms/Image/useUrlImage";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type { Router } from "@core/Api/Router";
import type useUrlObjectImage from "apps/browser/src/hooks/useUrlObjectImage";
import type BrowserRouter from "../../apps/browser/src/logic/Api/BrowserRouter";
import type NextRouter from "../../apps/next/logic/Api/NextRouter";
import type { httpFetch } from "../../apps/tauri/src/window/commands";
import type Link from "../../core/components/Atoms/Link";
import type FetchService from "../../core/ui-logic/ApiServices/FetchService";

interface DynamicModules {
	Link: typeof Link;
	Router: typeof BrowserRouter | typeof NextRouter;
	Fetcher: typeof FetchService.fetch;
	useImage: typeof useUrlImage | typeof useUrlObjectImage;
	FileInput: FileInput;
	DiffFileInput: DiffFileInput;
	openDirectory: () => string | Promise<string>;
	openInExplorer: (path: string) => void | Promise<void>;
	openInWeb: (url: string) => void | Promise<void>;
	enterpriseLogin: (url: string, apiUrlCreator: ApiUrlCreator, router: Router) => Promise<void>;
	openWindowWithUrl: (url: string) => void | Promise<void>;
	openChildWindow: ({
		url,
		redirect,
		name,
		features,
	}: {
		url: string;
		redirect?: string;
		name?: string;
		features?: string;
	}) => Promise<Window> | Window;
	httpFetch: typeof httpFetch;
	setBadge: (count: number | null) => void | Promise<void>;
}

let modules: DynamicModules = null;
let init: Promise<void> | null = null;

export const initModules = async (): Promise<void> => {
	if (init as any) return init;
	init = (async () => {
		const env = getExecutingEnvironment();
		switch (env) {
			case "browser":
				{
					const mod = await import("./frontend/browser");
					modules = await mod.getBrowserModules();
				}
				break;

			case "next":
				{
					const mod = await import("./frontend/next");
					modules = await mod.getNextModules();
				}
				break;

			case "test":
				{
					const mod = await import("./frontend/test");
					modules = await mod.getTestModules();
				}
				break;

			case "tauri":
				{
					const mod = await import("./frontend/tauri");
					modules = await mod.getTauriModules();
				}
				break;

			case "static":
				{
					const mod = await import("./frontend/static");
					modules = await mod.getStaticModules();
				}
				break;

			case "cli":
				{
					const mod = await import("./frontend/cli");
					modules = await mod.getCliModules();
				}
				break;

			default:
				throw new Error(`unsupported environment: ${env}`);
		}
	})();

	return init;
};

const resolveModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const module = modules?.[name];
	if (!module) throw new Error("module " + name + " not found");
	return module;
};

export default resolveModule;
