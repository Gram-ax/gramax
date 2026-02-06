import WorkspaceAssetsService, { useWorkspaceAssets } from "@core-ui/ContextServices/WorkspaceAssetsService";
import useWatch from "@core-ui/hooks/useWatch";
import { useCallback, useMemo, useState } from "react";

export const useWorkspaceStyle = (workspacePath: string) => {
	const { refreshStyle } = WorkspaceAssetsService.value();
	const { initialStyle, setCustomStyle } = useWorkspaceAssets(workspacePath);
	const [customCss, setCustomCss] = useState(initialStyle);

	useWatch(() => {
		setCustomCss(initialStyle);
	}, [initialStyle]);

	const revertCustomCss = useCallback(() => {
		setCustomCss(initialStyle);
	}, [initialStyle]);

	const confirmChanges = useCallback(async () => {
		if (initialStyle !== customCss) {
			await setCustomStyle(customCss);
			refreshStyle();
		}
	}, [initialStyle, customCss]);

	const haveChanges = useMemo(() => initialStyle !== customCss, [initialStyle, customCss]);

	return {
		haveChanges,
		customCss,
		revertCustomCss,
		confirmChanges,
		setCustomCss,
	};
};
