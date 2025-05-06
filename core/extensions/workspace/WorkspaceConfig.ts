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
	enterprise?: {
		gesUrl?: string;
		lastUpdateDate?: number;
	};
	gesUrl?: string; // legacy
}

export type WorkspacePath = string;

export type ClientWorkspaceConfig = { path: WorkspacePath } & WorkspaceConfig;
