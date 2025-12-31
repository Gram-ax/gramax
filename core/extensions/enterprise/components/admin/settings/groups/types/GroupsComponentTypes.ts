import { GroupValue } from "../../components/roles/Access";

export type GroupData = {
	name: string;
	members: GroupValue[];
};

export type GroupsSettings = {
	[id: string]: GroupData;
};

export interface Group {
	id: string;
	group: string;
	disabled: boolean | undefined;
}
