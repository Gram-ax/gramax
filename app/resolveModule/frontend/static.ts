export const getStaticModules = async (): Promise<any> => {
	const [
		{ default: BrowserLink },
		{ default: useUrlObjectImage },
		{ default: BrowserFetchService },
		{ default: BrowserRouter },
	] = await Promise.all([
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
		FileInput: () => null,
		DiffFileInput: () => null,
		httpFetch: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
	};
};
