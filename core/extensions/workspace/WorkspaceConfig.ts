import { ServicesConfig } from "@app/config/AppConfig";

export type WorkspaceGroup = {
	title: string;
	style: "big" | "small";
};

export interface WorkspaceConfig {
	name: string;
	icon?: string;
	groups?: Record<string, WorkspaceGroup>;
	services?: ServicesConfig;
	isEnterprise?: boolean;
	gesUrl?: string;
}

export type WorkspacePath = string;

export type ClientWorkspaceConfig = { path: WorkspacePath } & WorkspaceConfig;
