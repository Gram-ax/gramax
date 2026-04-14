import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

const useDesktopEnterpriseSession = () => {
	const pageDataContext = PageDataContextService.value;
	const currentWorkspacePath = pageDataContext.workspace.current;
	const activeGesUrl = pageDataContext.conf.enterprise.gesUrl;
	const workspaceConfig = pageDataContext.workspace.workspaces.find(
		(workspace) => workspace.path === currentWorkspacePath,
	);
	const workspaceGesUrl = workspaceConfig?.enterprise?.gesUrl;
	const isCurrentEnterpriseSession = Boolean(
		pageDataContext.isLogged && activeGesUrl && workspaceGesUrl === activeGesUrl,
	);

	return {
		isCurrentEnterpriseSession,
		shouldOpenTauriGesModal: !activeGesUrl,
	};
};

export default useDesktopEnterpriseSession;
