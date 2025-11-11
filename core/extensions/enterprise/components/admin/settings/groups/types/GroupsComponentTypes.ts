import { GroupValue } from "../../components/roles/Access";

export type GroupsSettings = {
	[name: string]: GroupValue[];
};

export interface Group {
	id: string;
	group: string;
	disabled: boolean | undefined;
}
