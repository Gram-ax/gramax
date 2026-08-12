import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type {
	GesRepo,
	GroupMember,
	GuestMember,
	MemberAccess,
	MemberAggregate,
	RepoAccesses,
	RepoGroupAccess,
	RepoGuestAccess,
	RepoUserAccess,
	UserMember,
} from "@ext/enterprise/components/admin/settings/members/model/Member";
import { emailKey } from "@ext/enterprise/components/admin/settings/members/model/Member";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";

export const makeGroup = (id: string, overrides?: Partial<GroupMember>): GroupMember => ({
	id,
	name: id,
	source: GroupSource.GX_GROUPS,
	isWorkspaceOwner: false,
	isSystem: false,
	...overrides,
});

export const makeUser = (value: string, overrides?: Partial<UserMember>): UserMember => ({
	value,
	isEditor: false,
	isWorkspaceOwner: false,
	...overrides,
});

export const makeGuest = (value: string): GuestMember => ({ value });

export const makeRepo = (id: string, overrides?: Partial<GesRepo>): GesRepo => ({
	id,
	isBase: false,
	mainBranch: "main",
	mainBranchProtected: false,
	...overrides,
});

export const makeAccess = (resourceId: string, role: RoleId, branches?: string[]): MemberAccess => ({
	resourceId,
	role,
	branches,
});

export type AggregateDeps = {
	groups?: GroupMember[];
	users?: UserMember[];
	guests?: GuestMember[];
	repos?: GesRepo[];
	editors?: UserMember[];
	editorsCount?: number;
	groupAccesses?: [string, MemberAccess[]][];
	userAccesses?: [string, MemberAccess[]][];
	guestAccesses?: [string, MemberAccess[]][];
	repoAccesses?: [string, RepoAccesses][];
	groupToUsers?: [string, string[]][];
	userToGroups?: [string, string[]][];
};

export const makeAggregate = (deps: AggregateDeps = {}): MemberAggregate => {
	const groups = deps.groups ?? [];
	const users = deps.users ?? [];
	const guests = deps.guests ?? [];
	const repos = deps.repos ?? [];
	const editors = deps.editors ?? [];
	const editorsCount = deps.editorsCount ?? (deps.editors ? deps.editors.length : 0);
	const groupAccesses = new Map(deps.groupAccesses ?? []);
	const userAccesses = new Map(deps.userAccesses ?? []);
	const guestAccesses = new Map(deps.guestAccesses ?? []);
	const repoAccesses = new Map(deps.repoAccesses ?? []);
	const groupToUsers = new Map(deps.groupToUsers ?? []);
	const userToGroups = new Map(deps.userToGroups ?? []);

	return {
		repos,
		groups,
		users,
		guests,
		editors,
		editorsCount,
		repoById: new Map(repos.map((r) => [r.id, r])),
		usersByValue: new Map(users.map((u) => [emailKey(u.value), u])),
		guestsByValue: new Map(guests.map((g) => [emailKey(g.value), g])),
		groupsById: new Map(groups.map((g) => [g.id, g])),
		groupAccesses,
		userAccesses,
		guestAccesses,
		repoAccesses,
		groupToUsers,
		userToGroups,
	};
};

export const emptyAggregate = makeAggregate();

export const makeRepoAccesses = (overrides?: Partial<RepoAccesses>): RepoAccesses => ({
	groups: [],
	users: [],
	guests: [],
	...overrides,
});

export const makeRepoGroupAccess = (group: GroupMember, role: RoleId): RepoGroupAccess => ({
	group,
	role,
});

export const makeRepoUserAccess = (user: UserMember, role: RoleId, branches?: string[]): RepoUserAccess => ({
	user,
	role,
	branches,
});

export const makeRepoGuestAccess = (guest: GuestMember, role: "reader" = "reader"): RepoGuestAccess => ({
	guest,
	role,
});
