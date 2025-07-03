export const getTauriModules = async (): Promise<any> => {
	const [
		{ default: LazyDiffFileInputTauri },
		{ default: LazyFileInputTauri },
		{ default: TauriLink },
		{ default: useUrlObjectImage2 },
		{ default: TauriFetcher },
		{ default: TauriRouter },
		tauriCommands,
		{ default: enterpriseLogin },
	] = await Promise.all([
		import("@components/Atoms/FileInput/DiffFileInput/LazyDiffFileInput"),
		import("@components/Atoms/FileInput/LazyFileInput"),
		import("../../../apps/browser/src/components/Atoms/Link"),
		import("../../../apps/browser/src/hooks/useUrlObjectImage"),
		import("../../../apps/browser/src/logic/Api/BrowserFetchService"),
		import("../../../apps/browser/src/logic/Api/BrowserRouter"),
		import("../../../apps/tauri/src/window/commands"),
		import("../../../apps/tauri/src/window/enterpriseLogin"),
	]);

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
	};
};
