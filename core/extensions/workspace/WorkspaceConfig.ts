export type WorkspaceGroup = {
	title: string;
	style: "big" | "small";
};

export type WorkspaceConfig = {
	name: string;
	icon?: string;
	groups?: WorkspaceGroup[];
};

export type WorkspacePath = string;

export type ClientWorkspaceConfig = { path: WorkspacePath } & WorkspaceConfig;
