import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";

export interface ResourcesSettings {
	id: string;
	mainBranch: string;
	mainBranchProtected: boolean;
	access: ClientAccess;
}

export interface ClientAccess {
	users: ClientAccessUser[];
	groups: ClientAccessGroup[];
	ssoGroups?: ClientAccessGroup[];
	externalUsers?: ClientAccessUser[];
}

export interface ClientAccessUser {
	value: string;
	role: RoleId;
	disabled?: boolean;
	props?: {
		branches?: string[];
	};
}

export interface ClientAccessGroup {
	id: string;
	role: RoleId;
	disabled?: boolean;
	name?: string;
	source: GroupSource;
}
