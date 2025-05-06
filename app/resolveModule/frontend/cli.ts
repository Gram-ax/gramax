export const getCliModules = async (): Promise<any> => {
	const [{ default: Link }, { default: StaticRouter }, { default: useUrlImage }] = await Promise.all([
		import("../../../apps/gramax-cli/src/Components/Atoms/Link"),
		import("../../../apps/gramax-cli/src/Components/Api/StaticRouter"),
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
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
	};
};
