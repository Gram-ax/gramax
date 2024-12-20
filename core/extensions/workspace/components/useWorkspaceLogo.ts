import WorkspaceAssetsService, { useLogoManager } from "@core-ui/ContextServices/WorkspaceAssetsService";
import useWatch from "@core-ui/hooks/useWatch";
import Theme from "@ext/Theme/Theme";
import { useState, useCallback } from "react";

export const logoToBase64 = (data: string) => {
	if (!data || typeof data !== "string") return "";
	return `data:image/svg+xml;base64,${btoa(data)}`;
};

export const useWorkspaceLogo = (workspacePath: string) => {
	const { refreshHomeLogo } = WorkspaceAssetsService.value();
	const {
		deleteLogo: deleteDark,
		updateLogo: updateDark,
		logo: initialDarkLogo,
	} = useLogoManager(workspacePath, Theme.dark);

	const {
		deleteLogo: deleteLight,
		updateLogo: updateLight,
		logo: initialLightLogo,
	} = useLogoManager(workspacePath, Theme.light);

	const [lightLogo, setLightLogo] = useState<string | null>(initialLightLogo);
	const [darkLogo, setDarkLogo] = useState<string | null>(initialDarkLogo);

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

	const updateLightLogo = useCallback((logo: string) => {
		const base64Logo = logoToBase64(logo);
		setLightLogo(base64Logo);
	}, []);

	const updateDarkLogo = useCallback((logo: string) => {
		const base64Logo = logoToBase64(logo);
		setDarkLogo(base64Logo);
	}, []);

	const confirmChanges = useCallback(async () => {
		let needRefreshLogo = false;

		if (initialLightLogo !== lightLogo) {
			needRefreshLogo = true;
			if (lightLogo) await updateLight(lightLogo);
			else await deleteLight();
		}

		if (initialDarkLogo !== darkLogo) {
			needRefreshLogo = true;
			if (darkLogo) await updateDark(darkLogo);
			else await deleteDark();
		}

		if (needRefreshLogo) await refreshHomeLogo();
	}, [initialLightLogo, lightLogo, initialDarkLogo, darkLogo]);

	return {
		deleteLightLogo,
		deleteDarkLogo,
		lightLogo,
		darkLogo,
		updateLightLogo,
		updateDarkLogo,
		confirmChanges,
	};
};
