import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useEffect } from "react";

const useSwitchToEnterpriseWorkspace = (isFirstLoad: boolean) => {
	const { isWeb } = usePlatform();
	const activeGesUrl = PageDataContextService.value.conf?.activeGesUrl;
	const workspaces = WorkspaceService.workspaces();
	const workspacePath = activeGesUrl
		? workspaces.find((workspace) => workspace.enterprise?.gesUrl === activeGesUrl)?.path
		: undefined;
	const { call: switchWorkspace } = useApi({
		url: (api) => (workspacePath ? api.switchWorkspace(workspacePath) : null),
	});

	useEffect(() => {
		if (!isFirstLoad || !workspacePath || !isWeb) return;

		void switchWorkspace?.();
	}, [isFirstLoad, workspacePath, isWeb, switchWorkspace]);
};

export default useSwitchToEnterpriseWorkspace;
