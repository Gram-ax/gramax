export const getBrowserModules = async (): Promise<any> => {
	const [
		{ default: BrowserLazyDiffFileInput },
		{ default: BrowserLazyFileInput },
		{ default: BrowserLink },
		{ default: useUrlObjectImage },
		{ default: BrowserFetchService },
		{ default: BrowserRouter },
	] = await Promise.all([
		import("@components/Atoms/FileInput/DiffFileInput/LazyDiffFileInput"),
		import("@components/Atoms/FileInput/LazyFileInput"),
		import("../../../apps/browser/src/components/Atoms/Link"),
		import("../../../apps/browser/src/hooks/useUrlObjectImage"),
		import("../../../apps/browser/src/logic/Api/BrowserFetchService"),
		import("../../../apps/browser/src/logic/Api/BrowserRouter"),
	]);

	return {
		Link: BrowserLink,
		Router: BrowserRouter,
		Fetcher: BrowserFetchService,
		useImage: useUrlObjectImage,
		openChildWindow: (params) => window.open(params.url, params.name, params.features),
		enterpriseLogin: () => Promise.resolve(null),
		openDirectory: () => "",
		FileInput: BrowserLazyFileInput,
		DiffFileInput: BrowserLazyDiffFileInput,
		httpFetch: () => undefined,
		setBadge: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
	};
};
