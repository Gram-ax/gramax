import type { EditorsSettings } from "@ext/enterprise/components/admin/settings/editors/types/EditorsComponentTypes";
import type { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import { emailKey } from "@ext/enterprise/components/admin/settings/members/model/Member";
import {
	applyGroupWorkspaceOwner,
	applyUserWorkspaceOwner,
} from "@ext/enterprise/components/admin/settings/members/model/workspaceOwnerOps";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { upsertBy } from "@ext/enterprise/utils/upsertBy";
import type { AccessChange } from "./AccessChange";

export interface AccessSnapshot {
	resources: ResourcesSettings[];
	groups: GroupsSettings;
	editors?: EditorsSettings;
	workspace?: WorkspaceSettings;
}

export const applyAccessChanges = (snapshot: AccessSnapshot, changes: AccessChange[]): AccessSnapshot => {
	if (changes.length === 0) return snapshot;

	const resources = new Map<string, ResourcesSettings>(
		snapshot.resources.map((resource) => [resource.id, structuredClone(resource)]),
	);
	const groups = structuredClone(snapshot.groups ?? {});
	let editors = [...(snapshot.editors?.editors ?? [])];
	let editorsTouched = false;
	const workspace = snapshot.workspace ? structuredClone<WorkspaceSettings>(snapshot.workspace) : undefined;
	let workspaceTouched = false;

	const getResource = (id: string): ResourcesSettings => {
		const existing = resources.get(id);
		if (existing) return existing;
		const created: ResourcesSettings = {
			id,
			mainBranch: "",
			mainBranchProtected: false,
			access: {
				groups: [],
				users: [],
				externalUsers: [],
				ssoGroups: [],
			},
		};
		resources.set(id, created);
		return created;
	};

	for (const change of changes) {
		switch (change.kind) {
			case "removeResource": {
				resources.delete(change.resourceId);
				break;
			}
			case "setResource": {
				const resource = getResource(change.resourceId);
				resource.mainBranch = change.mainBranch;
				resource.mainBranchProtected = change.branchProtected;
				break;
			}
			case "setGroupAccess": {
				const resource = getResource(change.resourceId);
				if (change.source === GroupSource.GX_GROUPS) {
					resource.access.groups = upsertBy(
						resource.access.groups,
						{
							id: change.groupId,
							role: change.role,
							source: change.source,
						},
						(x) => x.id,
					);
				} else {
					resource.access.ssoGroups = upsertBy(
						resource.access.ssoGroups,
						{
							id: change.groupId,
							role: change.role,
							source: change.source,
						},
						(x) => x.id,
					);
				}
				break;
			}
			case "removeGroupAccess": {
				const resource = getResource(change.resourceId);
				if (change.source === GroupSource.GX_GROUPS)
					resource.access.groups = resource.access.groups.filter((x) => x.id !== change.groupId);
				else resource.access.ssoGroups = resource.access.ssoGroups.filter((x) => x.id !== change.groupId);
				break;
			}
			case "setUserAccess": {
				const resource = getResource(change.resourceId);
				resource.access.users = upsertBy(
					resource.access.users,
					{
						value: change.userId,
						role: change.role,
						props: change.branches
							? {
									branches: change.branches,
								}
							: undefined,
					},
					(x) => emailKey(x.value),
				);
				break;
			}
			case "removeUserAccess": {
				const resource = getResource(change.resourceId);
				const userKey = emailKey(change.userId);
				resource.access.users = resource.access.users.filter((x) => emailKey(x.value) !== userKey);
				break;
			}
			case "createGroup": {
				if (!groups[change.groupId]) groups[change.groupId] = { name: change.groupName, members: [] };
				break;
			}
			case "deleteGroups": {
				for (const id of change.groupIds) delete groups[id];
				break;
			}
			case "setGroupUsers": {
				const data = groups[change.groupId];
				if (data) data.members = change.emails.map((value) => ({ value }));
				break;
			}
			case "setUserGroups": {
				const target = new Set(change.groupIds);
				const userKey = emailKey(change.email);
				for (const [groupId, data] of Object.entries(groups)) {
					const members = data.members ?? [];
					const has = members.some((member) => emailKey(member.value) === userKey);
					const should = target.has(groupId);
					if (has === should) continue;
					data.members = should
						? [...members, { value: change.email }]
						: members.filter((member) => emailKey(member.value) !== userKey);
				}
				break;
			}
			case "setEditorSlots": {
				editors = [...change.editors];
				editorsTouched = true;
				break;
			}
			case "setGroupWorkspaceOwner": {
				applyGroupWorkspaceOwner(workspace, change.groupId, change.source, change.owner);
				workspaceTouched = true;
				break;
			}
			case "setUserWorkspaceOwner": {
				applyUserWorkspaceOwner(workspace, change.userId, change.owner);
				workspaceTouched = true;
				break;
			}
			case "removeUserEverywhere": {
				const userKey = emailKey(change.userId);
				for (const resource of resources.values()) {
					resource.access.users = resource.access.users.filter((x) => emailKey(x.value) !== userKey);
				}
				for (const data of Object.values(groups))
					data.members = (data.members ?? []).filter((member) => emailKey(member.value) !== userKey);
				if (editors.some((email) => emailKey(email) === userKey)) {
					editors = editors.filter((email) => emailKey(email) !== userKey);
					editorsTouched = true;
				}
				break;
			}
			case "setGuestAccess": {
				const resource = getResource(change.resourceId);
				resource.access.externalUsers = upsertBy(
					resource.access.externalUsers,
					{
						value: change.userId,
						role: "reader",
					},
					(x) => emailKey(x.value),
				);
				break;
			}
			case "removeGuestAccess": {
				const resource = getResource(change.resourceId);
				const guestKey = emailKey(change.userId);
				resource.access.externalUsers = resource.access.externalUsers.filter(
					(x) => emailKey(x.value) !== guestKey,
				);
				break;
			}
			case "removeGuestEverywhere": {
				const guestKey = emailKey(change.userId);
				for (const resource of resources.values()) {
					resource.access.externalUsers = resource.access.externalUsers.filter(
						(x) => emailKey(x.value) !== guestKey,
					);
				}
				break;
			}
		}
	}

	return {
		resources: [...resources.values()],
		groups,
		editors: editorsTouched ? { count: snapshot.editors?.count ?? editors.length, editors } : snapshot.editors,
		workspace: workspaceTouched ? workspace : snapshot.workspace,
	};
};
