export const getCliModules = async (): Promise<any> => {
	const [{ default: Link }, { default: StaticRouter }, { default: useUrlImage }] = await Promise.all([
		import("../../../apps/browser/src/components/Atoms/Link"),
		import("../../../apps/gramax-cli/src/logic/api/StaticRouter"),
		import("../../../core/components/Atoms/Image/useUrlImage"),
	]);

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
	};
};
