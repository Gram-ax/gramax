import { ServicesConfig } from "@app/config/AppConfig";

export type WorkspaceGroup = {
	title: string;
	style: "big" | "small";
};

export interface WorkspaceConfig {
	name: string;
	icon?: string;
	groups?: WorkspaceGroup[];
	isEnterprise?: boolean;
	services?: ServicesConfig;
}

export type WorkspacePath = string;

export type ClientWorkspaceConfig = { path: WorkspacePath } & WorkspaceConfig;
