import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useEffect } from "react";

const useSwitchToEnterpriseWorkspace = (isFirstLoad: boolean) => {
	const { isBrowser } = usePlatform();
	const enterpriseConfig = PageDataContextService.value.conf?.enterprise;
	const workspaces = WorkspaceService.workspaces();
	const workspacePath = enterpriseConfig
		? workspaces.find((workspace) => workspace.enterprise?.gesUrl === enterpriseConfig.gesUrl)?.path
		: undefined;
	const { call: switchWorkspace } = useApi({
		url: (api) => (workspacePath ? api.switchWorkspace(workspacePath) : null),
	});

	useEffect(() => {
		if (!isFirstLoad || !workspacePath || !isBrowser) return;

		void switchWorkspace?.();
	}, [isFirstLoad, workspacePath, isBrowser]);
};

export default useSwitchToEnterpriseWorkspace;
