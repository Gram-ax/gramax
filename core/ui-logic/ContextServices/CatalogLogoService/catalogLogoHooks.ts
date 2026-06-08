import resolveModule from "@app/resolveModule/frontend";
import FetchService from "@core-ui/ApiServices/FetchService";
import type Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch, { useWatchClient } from "@core-ui/hooks/useWatch";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { useCallback, useRef, useState } from "react";

const useCatalogLogoManager = (catalogPath: string, theme: Theme) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [logo, setLogo] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const getLogo = useCallback(async () => {
		setIsLoading(true);
		const url = apiUrlCreator.getLogoUrl(catalogPath, theme, true);
		const res = await FetchService.fetch(url);

		setIsLoading(false);
		if (!res?.body) return "";
		const blob = new Blob([res.body as unknown as BlobPart], {
			type: resolveFileKind(res.body as unknown as Buffer),
		});

		return URL.createObjectURL(blob) || "";
	}, [catalogPath, theme]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const refreshLogo = useCallback(async () => {
		const logo = await getLogo();
		setLogo(logo);
	}, [catalogPath, theme]);

	useWatchClient(async () => {
		if (catalogPath) await refreshLogo();
	}, [getLogo, catalogPath, theme]);

	const resetState = useCallback(() => {
		setLogo("");
		setIsLoading(false);
	}, []);

	return { logo, isLoading, refreshLogo, resetState };
};

export const useCatalogLogo = (catalogPath?: string) => {
	const {
		isLoading: isLoadingDark,
		logo: initialDarkLogo,
		refreshLogo: refreshDarkLogo,
	} = useCatalogLogoManager(catalogPath, Theme.dark);

	const {
		isLoading: isLoadingLight,
		logo: initialLightLogo,
		refreshLogo: refreshLightLogo,
	} = useCatalogLogoManager(catalogPath, Theme.light);

	const [lightLogo, setLightLogo] = useState<string | null>(initialLightLogo);
	const [darkLogo, setDarkLogo] = useState<string | null>(initialDarkLogo);

	useWatch(() => {
		setLightLogo(initialLightLogo);
		setDarkLogo(initialDarkLogo);
	}, [initialDarkLogo, initialLightLogo]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const refreshState = useCallback(async () => {
		await refreshDarkLogo();
		await refreshLightLogo();
	}, []);

	return {
		isLoadingDark,
		isLoadingLight,
		lightLogo,
		darkLogo,
		refreshState,
	};
};

export const useGetCatalogLogoSrc = (catalogName: string, deeps = []) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const useImage = resolveModule("useImage");
	const [isExist, setIsExist] = useState(false);
	const [urlToFetch, setUrlToFetch] = useState<Url>();
	const activeRequestId = useRef(0);

	const getLogoUrlForTheme = useCallback(
		async (themeToCheck: Theme) => {
			if (!catalogName) return null;

			const existUrl = apiUrlCreator.catalogLogoExist(catalogName, themeToCheck);
			const res = await FetchService.fetch(existUrl);
			if (!res.ok || !res?.body) return null;

			const data: { isExist: boolean } = await res.json();
			return data.isExist ? apiUrlCreator.getLogoUrl(catalogName, themeToCheck, true) : null;
		},
		[apiUrlCreator, catalogName],
	);

	useWatchClient(async () => {
		activeRequestId.current += 1;
		const requestId = activeRequestId.current;

		if (!catalogName) {
			if (requestId === activeRequestId.current) {
				setIsExist(false);
				setUrlToFetch(undefined);
			}
			return;
		}

		const currentThemeLogo = await getLogoUrlForTheme(theme);
		if (requestId !== activeRequestId.current) return;

		if (currentThemeLogo) {
			setIsExist(true);
			setUrlToFetch(currentThemeLogo);
			return;
		}

		if (theme !== Theme.light) {
			const fallbackLogo = await getLogoUrlForTheme(Theme.light);
			if (requestId !== activeRequestId.current) return;

			if (fallbackLogo) {
				setIsExist(true);
				setUrlToFetch(fallbackLogo);
				return;
			}
		}

		setIsExist(false);
		setUrlToFetch(undefined);
	}, [theme, catalogName, ...deeps, getLogoUrlForTheme]);

	const src = useImage(urlToFetch, deeps);

	return { isExist, src };
};
