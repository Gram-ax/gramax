import LazyDiffFileInputTauri from "@components/Atoms/FileInput/DiffFileInput/LazyDiffFileInput";
import LazyFileInputTauri from "@components/Atoms/FileInput/LazyFileInput";
import { postUpdateAcceptance, UpdateAcceptance } from "../../../apps/tauri/src/update/updateEvents";
import * as tauriCommands from "../../../apps/tauri/src/window/commands";
import enterpriseLogin from "../../../apps/tauri/src/window/enterpriseLogin";
import TauriLink from "../../../apps/web/src/components/Atoms/Link";
import useUrlObjectImage2 from "../../../apps/web/src/hooks/useUrlObjectImage";
import getWebFetchService from "../../../apps/web/src/logic/Api/getWebFetchService";
import TauriRouter from "../../../apps/web/src/logic/Api/WebRouter";
import { getPdfjs } from "../../../apps/web/src/pdfjs/getPdfjs";
import gesCloudLogin from "../../../core/extensions/enterprise-cloud/desktop/gesCloudLogin";
import type { DynamicModules } from "..";

export const getTauriModules = (): DynamicModules => {
	return {
		Link: TauriLink,
		Router: TauriRouter,
		useImage: useUrlObjectImage2,
		Fetcher: getWebFetchService(),
		openChildWindow: tauriCommands.openChildWindow,
		enterpriseLogin,
		gesCloudLogin,
		FileInput: LazyFileInputTauri,
		DiffFileInput: LazyDiffFileInputTauri,
		openDirectory: tauriCommands.openDirectory,
		httpFetch: tauriCommands.httpFetch,
		setBadge: tauriCommands.setBadge,
		openInExplorer: tauriCommands.openInExplorer,
		openWindowWithUrl: tauriCommands.openWindowWithUrl,
		openInWeb: tauriCommands.openInWeb,
		getPdfjs,
		updateCheck: tauriCommands.updateCheck,
		updateInstallFromCache: tauriCommands.updateInstallByPath,
		updateAccept: () => postUpdateAcceptance(UpdateAcceptance.Accepted),
	};
};

const resolveFrontendModule = <K extends keyof DynamicModules>(name: K): DynamicModules[K] => {
	const modules = getTauriModules();
	const module = modules?.[name];
	if (!module) throw new Error(`module ${name} not found`);
	return module;
};

export default resolveFrontendModule;
