import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { AccessEntry, RoleId } from "../../components/roles/Access";

export function useWorkspaceAccess(
	localSettings: WorkspaceSettings,
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>,
) {
	const getAccessForRole = (role: RoleId) => {
		if (!localSettings?.access?.[role]) {
			return { gxGroups: [], users: [] };
		}
		return localSettings.access[role];
	};

	const handleRoleUpdate = (role: RoleId, access: AccessEntry) => {
		setLocalSettings((prev) => ({
			...prev,
			access: {
				...prev.access,
				[role]: access,
			},
		}));
	};

	return {
		getAccessForRole,
		handleRoleUpdate,
	};
}
