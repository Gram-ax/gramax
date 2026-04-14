export enum GroupSource {
	GX_GROUPS = "gxGroups",
	SSO_GROUPS = "ssoGroups",
}

export type Group = {
	id: string;
	name: string;
	source: GroupSource;
};
