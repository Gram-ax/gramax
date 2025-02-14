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

abstract class PermissionService {
	static Provider({ children, value }: { children: ReactElement; value: string }): ReactElement {
		const { global, workspace, catalog } = useMemo(() => {
			const { global, workspace, catalog }: ClientPermissions = value
				? JSON.parse(value)
				: { global: null, workspace: null, catalog: null };

			return {
				global: global ? parsePermissionFromJSON(global) : null,
				catalog: catalog ? parsePermissionMapFromJSON(catalog) : null,
				workspace: workspace ? parsePermissionMapFromJSON(workspace) : null,
			};
		}, [value]);

		return (
			<UserPermissionsContext.Provider value={{ global, workspace, catalog }}>
				{children}
			</UserPermissionsContext.Provider>
		);
	}

	static useCheckPermission(permission: IPermission, workspacePath?: WorkspacePath, catalogName?: string): boolean {
		const { global, workspace, catalog } = useContext(UserPermissionsContext);
		if (workspacePath && catalogName) return catalog?.enough(catalogName, permission);
		if (workspacePath) return workspace?.enough(workspacePath, permission);
		return global?.enough?.(permission);
	}
}

export default PermissionService;
