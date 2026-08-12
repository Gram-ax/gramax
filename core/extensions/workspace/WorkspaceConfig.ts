import type { ServicesConfig } from "@app/config/AppConfig";
import type { ModuleOptions } from "@ext/enterprise/types/UserSettings";
import type { AppSettings } from "@ext/settings/levels/app-settings";
import type { WorkspaceSettings } from "@ext/settings/levels/workspace-settings";
import type { StoredSettings } from "@ext/settings/logic/types";

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

export type WorkspaceSettingsSchema = StoredSettings<typeof WorkspaceSettings>;
export type WorkspaceAppSettingsSchema = StoredSettings<typeof AppSettings>;

export interface WorkspaceConfig {
	name: string;
	id?: string;
	icon?: string;
	webEditorUrl?: string;
	groups?: Record<string, WorkspaceSection>;
	sections?: Record<string, WorkspaceSection>;
	services?: ServicesConfig;
	enterprise?: {
		gesUrl?: string;
		lastUpdateDate?: number;
		refreshInterval?: number;
		modules?: ModuleOptions;
		lfs?: { patterns: string[] };
	};
	enterpriseCloud?: {
		url?: string;
	};
	git?: {
		lfs?: { patterns: string[] };
	};
	version?: number;
	settings?: WorkspaceSettingsSchema & WorkspaceAppSettingsSchema;
}

export type WorkspacePath = string;

export type ClientWorkspaceConfig = { path: WorkspacePath } & WorkspaceConfig;
