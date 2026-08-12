import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import type { AccessSnapshot } from "@ext/enterprise/components/admin/settings/members/model/applyAccessChanges";
import {
	isGroupWorkspaceOwner,
	isUserWorkspaceOwner,
} from "@ext/enterprise/components/admin/settings/members/model/workspaceOwnerOps";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import {
	getGroupDisplayNameById,
	getGroupsWithNames,
} from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/utils/groupUtils";
import type { searchGroupInfo, searchUserInfo } from "@ext/enterprise/EnterpriseService";
import { defaultGroupKeys } from "@ext/enterprise/types/EnterpriseAdmin";
import {
	emailKey,
	type GesRepo,
	type GroupMember,
	type GuestMember,
	type MemberAccess,
	type MemberAggregate,
	mapSsoToGroupMember,
	mapSsoToUserMember,
	type RepoAccesses,
	type UserMember,
} from "./Member";

interface RepoAccessesRaw {
	groups: RepoGroupAccessRaw[];
	users: RepoUserAccessRaw[];
	guests: RepoGuestAccessRaw[];
}

interface RepoGroupAccessRaw {
	id: string;
	role: RoleId;
}

interface RepoUserAccessRaw {
	id: string;
	role: RoleId;
	branches?: string[];
}

interface RepoGuestAccessRaw {
	id: string;
	role: "reader";
}

export const emptyAggregate = (): MemberAggregate => {
	return {
		editors: [],
		editorsCount: 0,
		groupAccesses: new Map(),
		groupToUsers: new Map(),
		groups: [],
		groupsById: new Map(),
		guestAccesses: new Map(),
		guests: [],
		guestsByValue: new Map(),
		repoAccesses: new Map(),
		repoById: new Map(),
		repos: [],
		userAccesses: new Map(),
		userToGroups: new Map(),
		users: [],
		usersByValue: new Map(),
	};
};

interface BuildMemberAggregateArgs {
	draft: AccessSnapshot;
	searchUsersByEmails: (xs: string[]) => Promise<searchUserInfo[]>;
	searchGroupsByIds: (xs: string[]) => Promise<searchGroupInfo[]>;
}

export const buildMemberAggregate = async (args: BuildMemberAggregateArgs): Promise<MemberAggregate> => {
	const { draft, searchGroupsByIds, searchUsersByEmails } = args;
	const { resources = [], groups: groupsSettings = {}, editors, workspace } = draft;
	const repos = new Map<string, GesRepo>();
	const users = new Map<string, UserMember>();
	const guests = new Map<string, GuestMember>();
	const groups = new Map<string, GroupMember>();
	const groupAccesses = new Map<string, MemberAccess[]>();
	const userAccesses = new Map<string, MemberAccess[]>();
	const guestAccesses = new Map<string, MemberAccess[]>();
	const repoAccessesRaw = new Map<string, RepoAccessesRaw>();
	const repoAccesses = new Map<string, RepoAccesses>();
	const editorEmails = editors?.editors ?? [];
	const editorKeys = new Set(editorEmails.map(emailKey));
	const baseRepos = new Set(workspace?.git?.source?.repos ?? []);

	const addGroupAccess = (key: string, access: MemberAccess): void => {
		const list = groupAccesses.get(key);
		if (list) list.push(access);
		else groupAccesses.set(key, [access]);
	};

	const addUserAccess = (key: string, access: MemberAccess): void => {
		const list = userAccesses.get(key);
		if (list) list.push(access);
		else userAccesses.set(key, [access]);
	};

	const addGuestAccess = (key: string, access: MemberAccess): void => {
		const list = guestAccesses.get(key);
		if (list) list.push(access);
		else guestAccesses.set(key, [access]);
	};

	const ensureRepoAccesses = (repoId: string): RepoAccessesRaw => {
		let entry = repoAccessesRaw.get(repoId);
		if (!entry) {
			entry = { groups: [], users: [], guests: [] };
			repoAccessesRaw.set(repoId, entry);
		}
		return entry;
	};

	const ensureRepo = (id: string, mainBranch: string | undefined, mainBranchProtected: boolean | undefined) => {
		if (!repos.has(id)) {
			repos.set(id, {
				id,
				mainBranch,
				mainBranchProtected,
				isBase: baseRepos.has(id),
			});
		}
	};

	const ensureUser = (email: string): UserMember => {
		const key = emailKey(email);
		const existing = users.get(key);
		if (existing) return existing;
		const created: UserMember = {
			value: email,
			isEditor: editorKeys.has(key),
			isWorkspaceOwner: isUserWorkspaceOwner(workspace, email),
		};
		users.set(key, created);
		return created;
	};

	const ensureGuest = (email: string): GuestMember => {
		const key = emailKey(email);
		const existing = guests.get(key);
		if (existing) return existing;
		const created: GuestMember = {
			value: email,
		};
		guests.set(key, created);
		return created;
	};

	const ensureGroup = (id: string, name: string, source: GroupSource): GroupMember => {
		const existing = groups.get(id);
		if (existing) return existing;
		const created: GroupMember = {
			id,
			name: name ?? id,
			source,
			isWorkspaceOwner: isGroupWorkspaceOwner(workspace, id, source),
			isSystem: defaultGroupKeys.includes(id),
		};
		groups.set(id, created);
		return created;
	};

	for (const group of getGroupsWithNames(groupsSettings)) {
		ensureGroup(group.id, group.name, group.source);
	}

	for (const email of editorEmails) {
		ensureUser(email);
	}

	for (const resource of resources) {
		ensureRepo(resource.id, resource.mainBranch, resource.mainBranchProtected);
		const access = resource.access;
		if (!access) continue;

		const repoAcc = ensureRepoAccesses(resource.id);

		for (const user of access.users ?? []) {
			const member = ensureUser(user.value);
			addUserAccess(emailKey(user.value), {
				resourceId: resource.id,
				role: user.role,
				branches: user.props?.branches,
			});
			repoAcc.users.push({ id: member.value, role: user.role, branches: user.props?.branches });
		}

		for (const externalUser of access.externalUsers ?? []) {
			const member = ensureGuest(externalUser.value);
			addGuestAccess(emailKey(externalUser.value), {
				resourceId: resource.id,
				role: externalUser.role,
				branches: externalUser.props?.branches,
			});
			repoAcc.guests.push({ id: member.value, role: externalUser.role as "reader" });
		}

		for (const group of access.groups ?? []) {
			const member = ensureGroup(group.id, group.name, GroupSource.GX_GROUPS);
			addGroupAccess(group.id, { resourceId: resource.id, role: group.role });
			repoAcc.groups.push({ id: member.id, role: group.role });
		}

		for (const group of access.ssoGroups ?? []) {
			const member = ensureGroup(group.id, group.name, GroupSource.SSO_GROUPS);
			addGroupAccess(group.id, { resourceId: resource.id, role: group.role });
			repoAcc.groups.push({ id: member.id, role: group.role });
		}
	}

	const { groupUsers: groupToUsers, userGroups: userToGroups } = buildGroupLinks(groupsSettings);

	for (const emails of groupToUsers.values()) {
		for (const email of emails) ensureUser(email);
	}

	const owner = workspace?.access?.workspaceOwner;
	for (const user of owner?.users ?? []) ensureUser(user.value);
	for (const id of owner?.gxGroups ?? [])
		ensureGroup(id, getGroupDisplayNameById(id, groupsSettings), GroupSource.GX_GROUPS);
	for (const id of owner?.ssoGroups ?? []) ensureGroup(id, id, GroupSource.SSO_GROUPS);

	if (searchUsersByEmails) {
		try {
			(await searchUsersByEmails([...users.values()].map((x) => x.value))).forEach((x) => {
				const newUser = mapSsoToUserMember(x, users);
				users.set(emailKey(newUser.value), newUser);
			});
		} catch {}
	}

	if (searchGroupsByIds) {
		try {
			(await searchGroupsByIds([...groups.values()].map((x) => x.id))).forEach((x) => {
				const newGroup = mapSsoToGroupMember(x, groups);
				groups.set(newGroup.id, newGroup);
			});
		} catch {}
	}

	for (const [k, v] of repoAccessesRaw) {
		const entry: RepoAccesses = {
			groups: [],
			guests: [],
			users: [],
		};
		for (const g of v.groups) {
			const group = groups.get(g.id);
			if (!group) continue;
			entry.groups.push({
				group,
				role: g.role,
			});
		}
		for (const u of v.users) {
			const user = users.get(emailKey(u.id));
			if (!user) continue;
			entry.users.push({
				user,
				role: u.role,
				branches: u.branches,
			});
		}
		for (const g of v.guests) {
			const guest = guests.get(emailKey(g.id));
			if (!guest) continue;
			entry.guests.push({
				guest,
				role: g.role,
			});
		}
		repoAccesses.set(k, entry);
	}

	const usersArr = [...users.values()];

	return {
		repos: [...repos.values()],
		groups: [...groups.values()],
		users: usersArr,
		guests: [...guests.values()],
		repoById: repos,
		groupsById: groups,
		usersByValue: users,
		guestsByValue: guests,
		groupAccesses,
		userAccesses,
		guestAccesses,
		repoAccesses,
		groupToUsers,
		userToGroups,
		editors: [...users.values()].filter((x) => x.isEditor),
		editorsCount: editors?.count ?? 0,
	};
};

const buildGroupLinks = (groups: GroupsSettings) => {
	const groupUsers = new Map<string, string[]>();
	const userGroups = new Map<string, string[]>();

	for (const [groupId, data] of Object.entries(groups ?? {})) {
		const emails = (data.members ?? []).map((member) => member.value);
		groupUsers.set(groupId, emails);
		for (const email of emails) {
			const key = emailKey(email);
			const list = userGroups.get(key);
			if (list) list.push(groupId);
			else userGroups.set(key, [groupId]);
		}
	}

	return { groupUsers, userGroups };
};
