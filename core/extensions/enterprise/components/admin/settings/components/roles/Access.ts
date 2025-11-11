import { tString } from "@ext/localization/locale/translate";

export type GroupId = string;
export type RoleId = "workspaceOwner" | "catalogOwner" | "editor" | "reviewer" | "reader";

export const ALL_ROLES = ["workspaceOwner", "catalogOwner", "editor", "reviewer", "reader"] as const;
export const WORKSPACE_ROLES = ["workspaceOwner"] as const;
export const REPOSITORY_USER_ROLES = ["catalogOwner", "editor", "reviewer", "reader"] as const;
export const REPOSITORY_GROUPS_ROLES = ["catalogOwner", "editor", "reader"] as const;
export const REPOSITORY_EXTERNAL_USERS_ROLES = ["reader"] as const;

export type GroupValue = {
	value: string;
	props?: { branches?: string[] };
};

export type AccessEntry = {
	gxGroups: GroupId[];
	users: GroupValue[];
};
export type Access = { [key in RoleId]?: AccessEntry };

export const getRoleName = (roleId: RoleId) => {
	const names: Record<RoleId, string> = {
		workspaceOwner: "enterprise.admin.roles.workspaceOwner",
		catalogOwner: "enterprise.admin.roles.catalogOwner",
		editor: "enterprise.admin.roles.editor",
		reviewer: "enterprise.admin.roles.reviewer",
		reader: "enterprise.admin.roles.reader",
	};
	return tString(names[roleId]);
};
