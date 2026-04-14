import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";

interface GroupValue {
	value: string;
	props?: {
		branches?: string[];
	};
}

export interface ResourcesSettings {
	id: string;
	mainBranch: string;
	access: ClientAccess;
}

export type ClientAccessUser = GroupValue & { role: RoleId; disabled?: boolean };
export type ClientAccessGroup = {
	id: string;
	role: RoleId;
	disabled?: boolean;
	name?: string;
	source?: GroupSource;
};

export type ClientAccessKey = "users" | "groups" | "ssoGroups" | "externalUsers";
export interface ClientAccess {
	users: ClientAccessUser[];
	groups: ClientAccessGroup[];
	ssoGroups?: ClientAccessGroup[];
	externalUsers?: ClientAccessUser[];
}

export interface ResourceItem {
	id: string;
	disabled?: boolean;
}
