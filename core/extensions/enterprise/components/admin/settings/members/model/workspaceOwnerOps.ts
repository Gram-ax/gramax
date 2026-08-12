import type { AccessEntry } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { emailKey } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";

const emptyOwner = (): AccessEntry => ({ gxGroups: [], users: [] });

export const isGroupWorkspaceOwner = (
	workspace: WorkspaceSettings | undefined,
	groupId: string,
	groupSource?: GroupSource,
): boolean => {
	const entry = workspace?.access?.workspaceOwner;
	if (!entry) return false;
	return groupSource === GroupSource.SSO_GROUPS
		? (entry.ssoGroups?.includes(groupId) ?? false)
		: entry.gxGroups.includes(groupId);
};

export const isUserWorkspaceOwner = (workspace: WorkspaceSettings | undefined, userId: string): boolean => {
	const entry = workspace?.access?.workspaceOwner;
	if (!entry) return false;
	const userKey = emailKey(userId);
	return entry.users.some((u) => emailKey(u.value) === userKey);
};

const toggleId = (ids: string[], id: string, owner: boolean): string[] =>
	owner ? [...new Set([...ids, id])] : ids.filter((value) => value !== id);

const ensureWorkspaceOwnerEntry = (workspace: WorkspaceSettings): AccessEntry => {
	if (!workspace.access) workspace.access = {};
	if (!workspace.access.workspaceOwner) workspace.access.workspaceOwner = emptyOwner();
	return workspace.access.workspaceOwner;
};

export const applyGroupWorkspaceOwner = (
	workspace: WorkspaceSettings,
	groupId: string,
	groupSource: GroupSource | undefined,
	owner: boolean,
) => {
	const entry = ensureWorkspaceOwnerEntry(workspace);

	if (groupSource === GroupSource.SSO_GROUPS) entry.ssoGroups = toggleId(entry.ssoGroups ?? [], groupId, owner);
	else entry.gxGroups = toggleId(entry.gxGroups, groupId, owner);
};

export const applyUserWorkspaceOwner = (workspace: WorkspaceSettings, userId: string, owner: boolean) => {
	const entry = ensureWorkspaceOwnerEntry(workspace);
	const userKey = emailKey(userId);

	entry.users = owner
		? entry.users.some((u) => emailKey(u.value) === userKey)
			? entry.users
			: [...entry.users, { value: userId }]
		: entry.users.filter((u) => emailKey(u.value) !== userKey);
};
