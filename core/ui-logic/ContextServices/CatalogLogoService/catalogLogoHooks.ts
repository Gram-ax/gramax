import resolveModule from "@app/resolveModule/frontend";
import FetchService from "@core-ui/ApiServices/FetchService";
import type Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useWatch, { useWatchClient } from "@core-ui/hooks/useWatch";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { useSetting } from "@ext/settings/logic/hooks";
import Theme from "@ext/Theme/Theme";
import { useCallback, useRef, useState } from "react";

export type CatalogLogo = { iconCode: string; iconColor?: string } | { emoji: string } | { src: string };

const useCatalogLogoManager = (catalogPath: string, theme: Theme) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [logo, setLogo] = useState("");
	const [isLoading, setIsLoading] = useState(false);

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
	const [theme] = useSetting("general.theme");
	const apiUrlCreator = ApiUrlCreatorService.value;
	const useImage = resolveModule("useImage");
	const [urlToFetch, setUrlToFetch] = useState<Url>();
	const [logo, setLogo] = useState<CatalogLogo>(null);
	const activeRequestId = useRef(0);

	const getLogoForTheme = useCallback(
		async (
			themeToCheck: Theme,
		): Promise<{ url: Url; iconCode?: string; iconColor?: string; emoji?: string } | null> => {
			if (!catalogName) return null;

			const existUrl = apiUrlCreator.catalogLogoExist(catalogName, themeToCheck);
			const res = await FetchService.fetch(existUrl);
			if (!res.ok || !res?.body) return null;

			const data: { isExist: boolean; iconCode?: string; iconColor?: string; emoji?: string } = await res.json();
			if (!data.isExist) return null;
			if (data.iconCode) return { url: null, iconCode: data.iconCode, iconColor: data.iconColor };
			if (data.emoji) return { url: null, emoji: data.emoji };
			return { url: apiUrlCreator.getLogoUrl(catalogName, themeToCheck, true) };
		},
		[catalogName],
	);

	useWatchClient(async () => {
		activeRequestId.current += 1;
		const requestId = activeRequestId.current;

		if (!catalogName) {
			if (requestId === activeRequestId.current) {
				setLogo(null);
				setUrlToFetch(undefined);
			}
			return;
		}

		const found =
			(await getLogoForTheme(theme)) ?? (theme !== Theme.light ? await getLogoForTheme(Theme.light) : null);

		if (requestId !== activeRequestId.current) return;

		if (!found) {
			setLogo(null);
			setUrlToFetch(undefined);
		} else if (found.iconCode) {
			setLogo({ iconCode: found.iconCode, iconColor: found.iconColor });
			setUrlToFetch(undefined);
		} else if (found.emoji) {
			setLogo({ emoji: found.emoji });
			setUrlToFetch(undefined);
		} else {
			setLogo(null);
			setUrlToFetch(found.url);
		}
	}, [theme, catalogName, ...deeps, getLogoForTheme]);

	const src = useImage(urlToFetch, deeps);

	return { logo: logo ?? (src ? { src } : null) } as { logo: CatalogLogo };
};
