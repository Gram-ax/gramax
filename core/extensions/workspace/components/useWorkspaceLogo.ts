import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import WorkspaceAssetsService, { useLogoManager } from "@core-ui/ContextServices/WorkspaceAssetsService";
import useWatch from "@core-ui/hooks/useWatch";
import Theme from "@ext/Theme/Theme";
import { UpdateResource } from "@ext/workspace/components/LogoUploader";
import { useCallback, useMemo, useState } from "react";

export const useWorkspaceLogo = (workspacePath: string) => {
	const { refreshHomeLogo } = WorkspaceAssetsService.value();
	const {
		deleteLogo: deleteDark,
		updateLogo: updateDark,
		isLoading: isLoadingDark,
		logo: initialDarkLogo,
	} = useLogoManager(workspacePath, Theme.dark);

	const {
		deleteLogo: deleteLight,
		updateLogo: updateLight,
		isLoading: isLoadingLight,
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

	const updateLightLogo: UpdateResource = useCallback(({ content }) => {
		const base64Logo = CustomLogoDriver.logoToBase64(content);
		setLightLogo(base64Logo);
	}, []);

	const updateDarkLogo: UpdateResource = useCallback(({ content }) => {
		const base64Logo = CustomLogoDriver.logoToBase64(content);
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

	const haveChanges = useMemo(
		() => initialDarkLogo !== darkLogo || initialLightLogo !== lightLogo,
		[initialDarkLogo, darkLogo, initialLightLogo, lightLogo],
	);

	return {
		haveChanges,
		deleteLightLogo,
		deleteDarkLogo,
		isLoadingDark,
		isLoadingLight,
		lightLogo,
		darkLogo,
		updateLightLogo,
		updateDarkLogo,
		confirmChanges,
	};
};
