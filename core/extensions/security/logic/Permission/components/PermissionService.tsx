import type { PageProps } from "@components/Pages/models/Pages";
import type ContextService from "@core-ui/ContextServices/ContextService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useIsEnterpriseWorkspace from "@ext/enterprise/utils/useIsEnterpriseWorkspace";
import type IPermission from "@ext/security/logic/Permission/IPermission";
import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import type ClientPermissions from "@ext/security/logic/Permission/model/ClientPermissions";
import type IPermissionMap from "@ext/security/logic/PermissionMap/IPermissionMap";
import parsePermissionMapFromJSON from "@ext/security/logic/PermissionMap/parsePermissionMapFromJSON";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { createContext, type ReactElement, useContext, useMemo } from "react";

const UserPermissionsContext = createContext<{
	global: IPermission;
	workspace: IPermissionMap;
	catalog: IPermissionMap;
}>(undefined);

class PermissionService implements ContextService {
	Init({ children, pageProps }: { children: ReactElement; pageProps: PageProps }): ReactElement {
		const { global, workspace, catalog } = useMemo(() => {
			const { global, workspace, catalog }: ClientPermissions = pageProps.context.permissions
				? JSON.parse(pageProps.context.permissions)
				: { global: null, workspace: null, catalog: null };

			return {
				global: global ? parsePermissionFromJSON(global) : null,
				catalog: catalog ? parsePermissionMapFromJSON(catalog) : null,
				workspace: workspace ? parsePermissionMapFromJSON(workspace) : null,
			};
		}, [pageProps.context.permissions]);

		return (
			<UserPermissionsContext.Provider value={{ global, workspace, catalog }}>
				{children}
			</UserPermissionsContext.Provider>
		);
	}

	useCheckPermission(permission: IPermission, workspacePath?: WorkspacePath, catalogName?: string): boolean {
		const { isTauri, isBrowser } = usePlatform();
		const isEnterpriseWorkspace = useIsEnterpriseWorkspace();
		const { global, workspace, catalog } = useContext(UserPermissionsContext);

		if (!isEnterpriseWorkspace && (isTauri || isBrowser)) return true;

		if (workspacePath && catalogName) return catalog?.enough(catalogName, permission);
		if (workspacePath) return workspace?.enough(workspacePath, permission);
		return global?.enough?.(permission);
	}

	useCheckAnyCatalogPermission(permission: IPermission): boolean {
		const { catalog } = useContext(UserPermissionsContext);
		return catalog?.someEnough(permission);
	}
}

export default new PermissionService();
