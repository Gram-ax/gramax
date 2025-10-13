import WorkspaceService from "@core-ui/ContextServices/Workspace";

const useIsEnterpriseWorkspace = () => {
	const workspace = WorkspaceService.current();
	return !!workspace?.enterprise?.gesUrl;
};

export default useIsEnterpriseWorkspace;
