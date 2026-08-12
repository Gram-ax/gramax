import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import type { searchGroupInfo, searchUserInfo } from "@ext/enterprise/EnterpriseService";
import { defaultGroupKeys } from "@ext/enterprise/types/EnterpriseAdmin";

export const getAccessRowId = (x: MemberAccess) => x.resourceId;
export const getRepoRowId = (x: GesRepo) => x.id;
export const getGroupRowId = (x: GroupMember) => x.id;
export const getUserRowId = (x: UserMember) => x.value;
export const getGuestRowId = (x: GuestMember) => x.value;

export const getBulkRepoRowId = <T extends { ent: { id: string } }>(x: T) => x.ent.id;
export const getBulkGroupRowId = <T extends { ent: { id: string } }>(x: T) => x.ent.id;
export const getBulkUserRowId = <T extends { ent: { value: string } }>(x: T) => x.ent.value;
export const getBulkGuestRowId = <T extends { ent: { value: string } }>(x: T) => x.ent.value;

export const getGroupAccessRowId = (x: RepoGroupAccess) => x.group.id;
export const getUserAccessRowId = (x: RepoUserAccess) => x.user.value;
export const getGuestAccessRowId = (x: RepoGuestAccess) => x.guest.value;

export const emailKey = (email: string) => email.toLowerCase();

export const mapSsoToUserMember = (x: searchUserInfo, usersByValue: Map<string, UserMember>): UserMember => {
	const user = usersByValue.get(emailKey(x.email));
	return {
		value: user?.value ?? x.email,
		name: x.name,
		isEditor: user?.isEditor,
		isWorkspaceOwner: user?.isWorkspaceOwner,
		isSso: true,
	};
};

export const mapSsoToGroupMember = (x: searchGroupInfo, groupsById: Map<string, GroupMember>): GroupMember => {
	const group = groupsById.get(x.id);
	return {
		id: x.id,
		name: x.name,
		source: GroupSource.SSO_GROUPS,
		isWorkspaceOwner: group?.isWorkspaceOwner,
		isSystem: false,
	};
};

interface MemberBase {
	isWorkspaceOwner: boolean;
}

export interface GroupMember extends MemberBase {
	id: string;
	name: string;
	isSystem: boolean;
	source: GroupSource;
}

export interface UserMember extends MemberBase {
	value: string;
	name?: string;
	isEditor: boolean;
	isSso?: boolean;
}

export interface GuestMember {
	value: string;
}

export interface MemberAccess {
	resourceId: string;
	role: RoleId;
	branches?: string[];
}

export interface RepoAccesses {
	groups: RepoGroupAccess[];
	users: RepoUserAccess[];
	guests: RepoGuestAccess[];
}

export interface RepoGroupAccess {
	group: GroupMember;
	role: RoleId;
}

export interface RepoUserAccess {
	user: UserMember;
	role: RoleId;
	branches?: string[];
}

export interface RepoGuestAccess {
	guest: GuestMember;
	role: "reader";
}

export interface GesRepo {
	id: string;
	isBase: boolean;
	mainBranch?: string;
	mainBranchProtected?: boolean;
}

export interface MemberAggregate {
	repos: GesRepo[];
	groups: GroupMember[];
	users: UserMember[];
	guests: GuestMember[];
	editors: UserMember[];
	editorsCount: number;
	repoById: Map<string, GesRepo>;
	usersByValue: Map<string, UserMember>;
	guestsByValue: Map<string, GuestMember>;
	groupsById: Map<string, GroupMember>;
	groupAccesses: Map<string, MemberAccess[]>;
	userAccesses: Map<string, MemberAccess[]>;
	guestAccesses: Map<string, MemberAccess[]>;
	repoAccesses: Map<string, RepoAccesses>;
	groupToUsers: Map<string, string[]>;
	userToGroups: Map<string, string[]>;
}

export const isSystemGroup = (member: GroupMember): boolean =>
	member.source === GroupSource.SSO_GROUPS || defaultGroupKeys.includes(member.id);
