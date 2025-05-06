import { PageProps } from "@components/ContextProviders";
import ContextService from "@core-ui/ContextServices/ContextService";
import IPermission from "@ext/security/logic/Permission/IPermission";
import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import ClientPermissions from "@ext/security/logic/Permission/model/ClientPermissions";
import IPermissionMap from "@ext/security/logic/PermissionMap/IPermissionMap";
import parsePermissionMapFromJSON from "@ext/security/logic/PermissionMap/parsePermissionMapFromJSON";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { createContext, ReactElement, useContext, useMemo } from "react";

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
		const { global, workspace, catalog } = useContext(UserPermissionsContext);
		if (workspacePath && catalogName) return catalog?.enough(catalogName, permission);
		if (workspacePath) return workspace?.enough(workspacePath, permission);
		return global?.enough?.(permission);
	}
}

export default new PermissionService();
