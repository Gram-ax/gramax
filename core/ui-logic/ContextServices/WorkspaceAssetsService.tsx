import FetchService from "@core-ui/ApiServices/FetchService";
import FetchResponse from "@core-ui/ApiServices/Types/FetchResponse";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useWatchClient } from "@core-ui/hooks/useWatch";
import useTrigger from "@core-ui/triggers/useTrigger";
import CustomLogoDriver from "@core/utils/CustomLogoDriver";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { ReactElement, createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

interface WorkspaceAssetsInterface {
	updateStyle: (newStyles: string) => void;
	refreshStyle: () => void;
	refreshHomeLogo: () => ReturnType<LogoManagerType["refreshLogo"]>;
	homeLogo?: LogoManagerType["logo"];
}

const WorkspaceAssetsContext = createContext<WorkspaceAssetsInterface>(undefined);

interface LogoManagerType {
	logo: string;
	isLoading: boolean;
	deleteLogo: () => Promise<FetchResponse<void>>;
	updateLogo: (logo: any) => Promise<void>;
	getLogo: () => Promise<string>;
	refreshLogo: () => Promise<void>;
}

export const useLogoManager = (workspacePath: WorkspacePath, theme: Theme, ignoreFetch?: boolean): LogoManagerType => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [logo, setLogo] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const getLogo = useCallback(async () => {
		setIsLoading(true);
		const url = apiUrlCreator.getHomeLogo(workspacePath, theme);
		const response = await FetchService.fetch(url);
		const logo = await response.text();

		setIsLoading(false);

		return logo || "";
	}, [workspacePath, theme]);

	const refreshLogo = useCallback(async () => {
		const logo = await getLogo();
		setLogo(logo);
	}, [workspacePath, theme]);

	useWatchClient(async () => {
		if (ignoreFetch) return;
		await refreshLogo();
	}, [getLogo, workspacePath, theme]);

	const updateLogo = useCallback(
		async (logo: any) => {
			const url = apiUrlCreator.updateHomeLogo(workspacePath, theme);
			await FetchService.fetch(url, logo);
			setLogo(logo);
		},
		[workspacePath, theme],
	);
	const deleteLogo = useCallback(() => {
		const url = apiUrlCreator.deleteHomeLogo(workspacePath, theme);
		return FetchService.fetch(url);
	}, [workspacePath, theme]);

	return {
		logo,
		isLoading,
		getLogo,
		refreshLogo,
		deleteLogo,
		updateLogo,
	};
};

const useStyleManager = (): Pick<WorkspaceAssetsInterface, "updateStyle"> => {
	const [styles, setStyles] = useState<string>("");

	const updateStyle = useCallback(
		(newStyles: string) => {
			if (styles !== newStyles) setStyles(newStyles);
		},
		[styles],
	);

	useEffect(() => {
		const styleElement = document.createElement("style");
		styleElement.id = "dynamic-styles";
		styleElement.textContent = styles;

		const existingStyleElement = document.getElementById("dynamic-styles");
		if (existingStyleElement) existingStyleElement.remove();

		document.head.appendChild(styleElement);

		return () => styleElement.remove();
	}, [styles]);

	return { updateStyle };
};

interface WorkspaceAssetsType {
	getCustomStyle: () => Promise<string>;
	setCustomStyle: (data: string) => Promise<FetchResponse<void>>;
	initialStyle?: string;
}

export const useWorkspaceAssets = (workspacePath?: string): WorkspaceAssetsType => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [initialStyle, setInitialStyle] = useState("");

	const getCustomStyle = useCallback(async () => {
		if (!workspacePath) return "";
		const url = apiUrlCreator.getCustomStyleAsset(workspacePath);
		const res = await FetchService.fetch(url);
		if (!res.ok) return "";

		return res.text();
	}, [workspacePath]);

	useWatchClient(async () => {
		const styles = await getCustomStyle();
		setInitialStyle(styles);
	}, [workspacePath]);

	const setCustomStyle = useCallback(
		async (style: string) => {
			if (!workspacePath) return;
			const url = apiUrlCreator.setCustomStyleAsset(workspacePath);
			return FetchService.fetch(url, style);
		},
		[workspacePath],
	);

	return {
		initialStyle,
		getCustomStyle,
		setCustomStyle,
	};
};

const updateCustomLogo = (path: WorkspacePath) => {
	const { getLogo: getLightLogo } = useLogoManager(path, Theme.light, true);
	const { getLogo: getDarkLogo } = useLogoManager(path, Theme.dark, true);
	const [value, forceUpdate] = useTrigger();

	const updateLogoInLocalStore = useCallback(async () => {
		const lightLogo = await getLightLogo();
		const darkLogo = await getDarkLogo();
		CustomLogoDriver.updateLogo(lightLogo, Theme.light);
		CustomLogoDriver.updateLogo(darkLogo, Theme.dark);
	}, [path]);

	const forceUpdateLogo = useCallback(() => {
		forceUpdate();
	}, [forceUpdate]);

	useEffect(() => {
		void updateLogoInLocalStore();
	}, [updateLogoInLocalStore, value]);

	return { forceUpdateLogoInStorage: forceUpdateLogo };
};

class WorkspaceAssetsService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const { updateStyle } = useStyleManager();
		const workspace = WorkspaceService.current() || { path: undefined };
		const { forceUpdateLogoInStorage } = updateCustomLogo(workspace.path);
		const theme = ThemeService.value;

		const { logo: logoDark, refreshLogo: refreshDarkLogo } = useLogoManager(workspace.path, Theme.dark);
		const { logo: logoLight, refreshLogo: refreshLightLogo } = useLogoManager(workspace.path, Theme.light);
		const { getCustomStyle } = useWorkspaceAssets(workspace.path);

		const logo = useMemo(() => {
			if (theme === Theme.dark && !logoDark) {
				return logoLight;
			}
			return theme === Theme.light ? logoLight : logoDark;
		}, [logoDark, logoLight, theme]);

		const refreshStyle = useCallback(async () => {
			updateStyle(await getCustomStyle());
		}, [updateStyle, getCustomStyle]);

		const refreshHomeLogo = async () => {
			await refreshDarkLogo();
			await refreshLightLogo();
			forceUpdateLogoInStorage();
		};

		useWatchClient(() => {
			void refreshStyle();
		}, [workspace.path]);

		return (
			<WorkspaceAssetsContext.Provider value={{ refreshHomeLogo, homeLogo: logo, updateStyle, refreshStyle }}>
				{children}
			</WorkspaceAssetsContext.Provider>
		);
	}

	static value() {
		return useContext(WorkspaceAssetsContext);
	}
}

export default WorkspaceAssetsService;
