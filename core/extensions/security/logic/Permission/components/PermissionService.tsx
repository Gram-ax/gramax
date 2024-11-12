import IPermission from "@ext/security/logic/Permission/IPermission";
import parsePermissionFromJSON from "@ext/security/logic/Permission/logic/PermissionParser";
import ClientPermissions from "@ext/security/logic/Permission/model/ClientPermissions";
import { createContext, ReactElement, useContext, useMemo } from "react";

const UserPermissionsContext = createContext<{ global: IPermission; enterprise: Record<string, IPermission> }>(
	undefined,
);

abstract class PermissionService {
	static Provider({ children, value }: { children: ReactElement; value: string }): ReactElement {
		const { global, enterprise } = useMemo(() => {
			const { global, enterprise }: ClientPermissions = value
				? JSON.parse(value)
				: { global: null, enterprise: null };
			return {
				global: global ? parsePermissionFromJSON(global) : null,
				enterprise: enterprise
					? Object.fromEntries(
							Object.entries(enterprise).map(([key, value]) => [key, parsePermissionFromJSON(value)]),
					  )
					: null,
			};
		}, [value]);

		return (
			<UserPermissionsContext.Provider value={{ global, enterprise }}>{children}</UserPermissionsContext.Provider>
		);
	}

	static useCheckPermission(permission: IPermission, catalogName?: string): boolean {
		if (catalogName) {
			const { global, enterprise } = useContext(UserPermissionsContext);
			return global?.enough?.(permission) || enterprise?.[catalogName]?.enough?.(permission);
		}
		const { global } = useContext(UserPermissionsContext);
		return global?.enough?.(permission);
	}
}

export default PermissionService;
