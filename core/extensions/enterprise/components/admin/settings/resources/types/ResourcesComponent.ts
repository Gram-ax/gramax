import { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";

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
export type ClientAccessGroup = { id: string; role: RoleId; disabled?: boolean };

export type ClientAccessKey = "users" | "groups" | "externalUsers";
export interface ClientAccess {
	users: ClientAccessUser[];
	groups: ClientAccessGroup[];
	externalUsers?: ClientAccessUser[];
}

export interface ResourceItem {
	id: string;
	disabled?: boolean;
}
