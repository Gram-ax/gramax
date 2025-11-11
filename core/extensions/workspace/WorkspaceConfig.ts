import { ServicesConfig } from "@app/config/AppConfig";
import { AuthMethod, ModuleOptions } from "@ext/enterprise/types/UserSettings";

export enum WorkspaceView {
	folder = "folder",
	section = "section",
}

export type WorkspaceSection = {
	title: string;
	icon?: string;
	view?: WorkspaceView;
	description?: string;
	catalogs?: string[];
	sections?: Record<string, WorkspaceSection>;
};

export interface WorkspaceConfig {
	name: string;
	icon?: string;
	groups?: Record<string, WorkspaceSection>;
	sections?: Record<string, WorkspaceSection>;
	services?: ServicesConfig;
	enterprise?: {
		gesUrl?: string;
		refreshInterval?: number;
		lastUpdateDate?: number;
		authMethods?: AuthMethod[];
		modules?: ModuleOptions;
	};
	gesUrl?: string; // legacy
}

export type WorkspacePath = string;

export type ClientWorkspaceConfig = { path: WorkspacePath } & WorkspaceConfig;
