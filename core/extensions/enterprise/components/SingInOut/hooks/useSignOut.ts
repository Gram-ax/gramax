import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import type SignOutEnterprise from "@ext/enterprise/components/SingInOut/SignOutEnterprise";
import { type ComponentProps, useCallback } from "react";

const useSignOut = () => {
	const pageDataContext = PageDataContextService.value;
	const isLogged = pageDataContext.isLogged;
	const workspaceContext = pageDataContext.workspace;
	const currentWorkspaceName = pageDataContext.workspace.current;
	const activeGesUrl = pageDataContext.conf.enterprise.gesUrl;

	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);
	const workspaceGesUrl = workspaceConfig?.enterprise?.gesUrl;
	const canLogoutEnterprise = Boolean(activeGesUrl && workspaceGesUrl === activeGesUrl);

	const onLogoutClick = useCallback(() => {
		if (!workspaceConfig || !canLogoutEnterprise) return;

		ModalToOpenService.addModal<ComponentProps<typeof SignOutEnterprise>>(ModalToOpen.EnterpriseLogout, {
			workspaceConfig,
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, [canLogoutEnterprise, workspaceConfig]);

	return { isLogged, onLogoutClick, canLogoutEnterprise };
};

export default useSignOut;
