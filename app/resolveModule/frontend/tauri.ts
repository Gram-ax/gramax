import LazyDiffFileInputTauri from "@components/Atoms/FileInput/DiffFileInput/LazyDiffFileInput";
import LazyFileInputTauri from "@components/Atoms/FileInput/LazyFileInput";
import TauriLink from "../../../apps/browser/src/components/Atoms/Link";
import useUrlObjectImage2 from "../../../apps/browser/src/hooks/useUrlObjectImage";
import TauriFetcher from "../../../apps/browser/src/logic/Api/BrowserFetchService";
import TauriRouter from "../../../apps/browser/src/logic/Api/BrowserRouter";
import { getPdfjs } from "../../../apps/browser/src/pdfjs/getPdfjs";
import * as tauriCommands from "../../../apps/tauri/src/window/commands";
import enterpriseLogin from "../../../apps/tauri/src/window/enterpriseLogin";
import type { DynamicModules } from "..";

export const getTauriModules = (): DynamicModules => {
	return {
		Link: TauriLink,
		Router: TauriRouter,
		useImage: useUrlObjectImage2,
		Fetcher: TauriFetcher,
		openChildWindow: tauriCommands.openChildWindow,
		enterpriseLogin,
		FileInput: LazyFileInputTauri,
		DiffFileInput: LazyDiffFileInputTauri,
		openDirectory: tauriCommands.openDirectory,
		httpFetch: tauriCommands.httpFetch,
		setBadge: tauriCommands.setBadge,
		openInExplorer: tauriCommands.openInExplorer,
		openWindowWithUrl: tauriCommands.openWindowWithUrl,
		openInWeb: tauriCommands.openInWeb,
		getPdfjs,
	};
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getTauriModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
