const getNextModules = async (): Promise<any> => {
	const [
		{ default: DiffFileInputCdn },
		{ default: FileInputCdn },
		{ default: LanguageServiceModule },
		{ default: LocalizerModule },
		{ default: NextLink },
		{ default: NextRouter },
		{ default: useUrlImage },
	] = await Promise.all([
		import("@components/Atoms/FileInput/DiffFileInput/DiffFileInputCdn"),
		import("@components/Atoms/FileInput/FileInputCdn"),
		import("@core-ui/ContextServices/Language"),
		import("@ext/localization/core/Localizer"),
		import("../../../apps/next/components/Atoms/Link"),
		import("../../../apps/next/logic/Api/NextRouter"),
		import("../../../core/components/Atoms/Image/useUrlImage"),
	]);

	return {
		Link: NextLink,
		Router: NextRouter,
		Fetcher: async <T = any>(url: any, body?: BodyInit, mime?: any, method?: any) => {
			const l = LocalizerModule.extract(typeof window === "undefined" ? "" : window.location.pathname);
			const headers = {
				"Content-Type": mime,
				"x-gramax-ui-language": LanguageServiceModule.currentUi(),
				"x-gramax-language": l,
			};

			const res = (await fetch(
				url.toString(),
				body
					? {
							method,
							body,
							headers,
					  }
					: { headers },
			)) as any;
			res.buffer = async () => Buffer.from(await res.arrayBuffer());
			return res;
		},
		useImage: useUrlImage,
		enterpriseLogin: () => Promise.resolve(null),
		openChildWindow: (params) =>
			typeof window === "undefined" ? undefined : window.open(params.url, params.name, params.features),
		openDirectory: () => "",
		FileInput: FileInputCdn,
		DiffFileInput: DiffFileInputCdn,
		httpFetch: () => undefined,
		openInExplorer: () => undefined,
		openWindowWithUrl: () => undefined,
	};
};

export { getNextModules };
