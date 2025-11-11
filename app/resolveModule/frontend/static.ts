export const getStaticModules = async (): Promise<any> => {
	const [
		{ default: BrowserLink },
		{ default: useUrlObjectImage },
		{ default: BrowserFetchService },
		{ default: StaticRouter },
	] = await Promise.all([
		import("../../../apps/gramax-cli/src/Components/Atoms/Link"),
		import("../../../apps/browser/src/hooks/useUrlObjectImage"),
		import("../../../apps/browser/src/logic/Api/BrowserFetchService"),
		import("../../../apps/gramax-cli/src/logic/api/StaticRouter"),
	]);

	return {
		Link: BrowserLink,
		Router: StaticRouter,
		Fetcher: BrowserFetchService,
		useImage: useUrlObjectImage,
		openChildWindow: (params) => window.open(params.url, params.name, params.features),
		enterpriseLogin: () => Promise.resolve(null),
		openDirectory: () => "",
		FileInput: () => null,
		DiffFileInput: () => null,
		httpFetch: () => undefined,
		setBadge: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
		openInWeb: (url: string) => (typeof window === "undefined" ? undefined : window.open(url)),
	};
};
