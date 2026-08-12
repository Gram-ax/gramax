import {
	REPOSITORY_EXTERNAL_USERS_ROLES,
	REPOSITORY_USER_ROLES,
	type RoleId,
} from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { ClientAccessUser } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import t from "@ext/localization/locale/translate";
import { useMemo } from "react";

export const MIXED_ROLE = "__mixed__";
export type RoleValue = RoleId | typeof MIXED_ROLE;

export interface RoleRules {
	roles: readonly RoleId[];
	locked: boolean;
	disabledReason: (role: RoleId) => string | undefined;
}

export const getGroupRules = (): RoleRules => {
	return {
		roles: REPOSITORY_USER_ROLES,
		locked: false,
		disabledReason: (role) => role === "reviewer" && t("enterprise.admin.users.user-only-role-hint"),
	};
};

export const getGuestRules = (): RoleRules => {
	const reasons: Partial<Record<RoleId, string>> = {};
	for (const role of REPOSITORY_USER_ROLES) {
		if (role !== "reader") reasons[role] = t("enterprise.admin.guests.reader-only-hint");
	}

	return {
		roles: REPOSITORY_EXTERNAL_USERS_ROLES,
		locked: true,
		disabledReason: (role) => reasons[role],
	};
};

export const getUserRules = (): RoleRules => {
	return {
		roles: REPOSITORY_USER_ROLES,
		locked: false,
		disabledReason: () => undefined,
	};
};

export const getBulkRepoUserRules = (): RoleRules => {
	return {
		roles: REPOSITORY_USER_ROLES,
		disabledReason: (role) => role === "reviewer" && t("enterprise.admin.not-available-in-bulk"),
		locked: false,
	};
};

export const useGroupRoleRules = () => {
	const roleRules = useMemo(() => getGroupRules(), []);
	return { roleRules };
};

export const useUserRoleRules = () => {
	const roleRules = useMemo(() => getUserRules(), []);
	return { roleRules };
};

export const useBulkRepoUserRoleRules = () => {
	const roleRules = useMemo<RoleRules>(() => getBulkRepoUserRules(), []);
	return { roleRules };
};

export const useGuestRoleRules = () => {
	const roleRules = useMemo(() => getGuestRules(), []);
	return { roleRules };
};

export const isMixedRole = (value: RoleValue | undefined): value is typeof MIXED_ROLE => value === MIXED_ROLE;

export const hasReviewerWithoutBranches = (entries: ClientAccessUser[]): boolean =>
	entries.some((entry) => entry.role === "reviewer" && !entry.props?.branches?.length);

export const reviewerHasNoBranches = (role: string | undefined, branches?: string[]): boolean =>
	role === "reviewer" && (branches?.length ?? 0) === 0;
