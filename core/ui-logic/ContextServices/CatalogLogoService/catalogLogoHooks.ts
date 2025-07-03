import resolveModule from "@app/resolveModule/frontend";
import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import useWatch, { useWatchClient } from "@core-ui/hooks/useWatch";
import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { useCallback, useRef, useState } from "react";

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
		const blob = new Blob([res.body as any], { type: resolveImageKind(res.body as any) });

		return URL.createObjectURL(blob) || "";
	}, [catalogPath, theme]);

	const refreshLogo = useCallback(async () => {
		const logo = await getLogo();
		setLogo(logo);
	}, [catalogPath, theme]);

	useWatchClient(async () => {
		if (catalogPath) await refreshLogo();
	}, [getLogo, catalogPath, theme]);

	const updateLogo = useCallback(
		async (logo: any, name: string) => {
			const url = apiUrlCreator.updateCatalogLogo(catalogPath, name);
			await FetchService.fetch(url, logo);
			setLogo(logo);
		},
		[catalogPath, theme],
	);

	const deleteLogo = useCallback(() => {
		const url = apiUrlCreator.deleteCatalogLogo(catalogPath, theme);
		return FetchService.fetch(url);
	}, [catalogPath, theme]);

	const resetState = useCallback(() => {
		setLogo("");
		setIsLoading(false);
	}, []);

	return {
		logo,
		isLoading,
		getLogo,
		refreshLogo,
		deleteLogo,
		updateLogo,
		resetState,
	};
};

export const useCatalogLogo = (catalogPath?: string, successUpdateCallback?: () => void) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogProps = CatalogPropsService.value;

	const {
		deleteLogo: deleteDark,
		updateLogo: updateDark,
		isLoading: isLoadingDark,
		logo: initialDarkLogo,
		refreshLogo: refreshDarkLogo,
	} = useCatalogLogoManager(catalogPath, Theme.dark);

	const {
		deleteLogo: deleteLight,
		updateLogo: updateLight,
		isLoading: isLoadingLight,
		logo: initialLightLogo,
		refreshLogo: refreshLightLogo,
	} = useCatalogLogoManager(catalogPath, Theme.light);

	const [lightLogo, setLightLogo] = useState<string | null>(initialLightLogo);
	const [darkLogo, setDarkLogo] = useState<string | null>(initialDarkLogo);
	const logoProps = useRef<{ logo?: string; logo_dark?: string }>({});

	useWatch(() => {
		setLightLogo(initialLightLogo);
		setDarkLogo(initialDarkLogo);
	}, [initialDarkLogo, initialLightLogo]);

	const deleteLightLogo = useCallback(() => {
		setLightLogo(null);
	}, []);

	const deleteDarkLogo = useCallback(() => {
		setDarkLogo(null);
	}, []);

	const updateLightLogo: UpdateResource = useCallback(({ content, fileName, type }) => {
		const base64Logo = type === "png" ? content : CustomLogoDriver.logoToBase64(content);
		logoProps.current.logo = fileName;
		setLightLogo(base64Logo);
	}, []);

	const updateDarkLogo: UpdateResource = useCallback(({ content, fileName, type }) => {
		const base64Logo = type === "png" ? content : CustomLogoDriver.logoToBase64(content);
		logoProps.current.logo_dark = fileName;
		setDarkLogo(base64Logo);
	}, []);

	const confirmChanges = useCallback(async () => {
		const props: Record<string, unknown> = {};

		if (initialLightLogo !== lightLogo) {
			await deleteLight();
			if (lightLogo) {
				await updateLight(lightLogo, logoProps.current.logo);
				props.logo = logoProps.current.logo;
			} else {
				props.logo = "";
			}
		}

		if (initialDarkLogo !== darkLogo) {
			await deleteDark();
			if (darkLogo) {
				await updateDark(darkLogo, logoProps.current.logo_dark);
				props.logo_dark = logoProps.current.logo_dark;
			} else {
				props.logo_dark = "";
			}
		}

		if (typeof props.logo === "string" || typeof props.logo_dark === "string") {
			const UrlToUpdate = apiUrlCreator.updateCatalogProps();
			//FIXME, нужно убрать два вызова апдейта пропсов, например в форме catalogPropsEditor

			const CatalogPropsWithLogo = Object.assign(catalogProps, props);
			await FetchService.fetch(UrlToUpdate, JSON.stringify(CatalogPropsWithLogo), MimeTypes.json);

			successUpdateCallback?.();
		}
	}, [initialLightLogo, lightLogo, initialDarkLogo, darkLogo, catalogProps]);

	const refreshState = useCallback(async () => {
		await refreshDarkLogo();
		await refreshLightLogo();
	}, []);

	return {
		deleteLightLogo,
		deleteDarkLogo,
		isLoadingDark,
		isLoadingLight,
		lightLogo,
		darkLogo,
		updateLightLogo,
		updateDarkLogo,
		confirmChanges,
		refreshState,
	};
};

export const useGetCatalogLogoSrc = (catalogName: string, deeps = []) => {
	const theme = ThemeService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const useImage = resolveModule("useImage");
	const [isExist, setIsExist] = useState(false);
	const [urlToFetch, setUrlToFetch] = useState<Url>();

	useWatchClient(async () => {
		const url = apiUrlCreator.catalogLogoExist(catalogName, theme);
		const res = await FetchService.fetch(url);
		if (!res?.body) return;
		const data: { isExist: boolean } = await res.json();
		const isExist = data.isExist;

		if (isExist) {
			setIsExist(isExist);
			setUrlToFetch(apiUrlCreator.getLogoUrl(catalogName, theme, true));
			return;
		} else {
			if (theme !== Theme.light) {
				const url = apiUrlCreator.catalogLogoExist(catalogName, Theme.light);
				const res = await FetchService.fetch(url);
				if (!res?.body) return;
				const data: { isExist: boolean } = await res.json();
				if (data.isExist) {
					setIsExist(data.isExist);
					setUrlToFetch(apiUrlCreator.getLogoUrl(catalogName, Theme.light, true));
				}
				return;
			}
		}
		setIsExist(false);
		setUrlToFetch(undefined);
	}, [theme, catalogName, ...deeps]);

	const src = useImage(urlToFetch, deeps);

	return { isExist, src };
};
