import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import type { AccessEntry, RoleId } from "../../components/roles/Access";

const EMPTY_GROUP_IDS: string[] = [];
const EMPTY_USERS_VALUES: AccessEntry["users"] = [];
const EMPTY_SSO_GROUPS: NonNullable<AccessEntry["ssoGroups"]> = [];

export function useWorkspaceAccess(
	localSettings: WorkspaceSettings,
	setLocalSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>,
) {
	const getAccessForRole = (role: RoleId) => {
		if (!localSettings?.access?.[role]) {
			return { gxGroups: EMPTY_GROUP_IDS, ssoGroups: EMPTY_SSO_GROUPS, users: EMPTY_USERS_VALUES };
		}
		return {
			gxGroups: localSettings.access[role].gxGroups ?? EMPTY_GROUP_IDS,
			ssoGroups: localSettings.access[role].ssoGroups ?? EMPTY_SSO_GROUPS,
			users: localSettings.access[role].users ?? EMPTY_USERS_VALUES,
		};
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
