import type { ServicesConfig } from "@app/config/AppConfig";
import type { ModuleOptions } from "@ext/enterprise/types/UserSettings";

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
	id?: string;
	icon?: string;
	webEditorUrl?: string;
	groups?: Record<string, WorkspaceSection>;
	sections?: Record<string, WorkspaceSection>;
	services?: ServicesConfig;
	enterprise?: {
		gesUrl?: string;
		refreshInterval?: number;
		lastUpdateDate?: number;
		modules?: ModuleOptions;
	};

	/** @deprecated use enterprise.gesUrl instead */
	gesUrl?: string; // legacy
	/** @deprecated delete this field after 01.03.2026 */
	// biome-ignore lint/suspicious/noExplicitAny: <legacy field>
	pdfTemplates?: any;
	/** @deprecated delete this field after 01.03.2026 */
	// biome-ignore lint/suspicious/noExplicitAny: <legacy field>
	wordTemplates?: any;
}

export type WorkspacePath = string;

export type ClientWorkspaceConfig = { path: WorkspacePath } & WorkspaceConfig;
