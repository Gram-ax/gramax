import type { AiServerConfig } from "@ext/ai/models/types";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import type { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import type { PluginConfig } from "@plugins/types";

type SVG = string;

interface WorkspaceSource {
	type: SourceType;
	url: string;
	repos: string[];
}

interface WorkspaceGit {
	source: WorkspaceSource;
	lfs?: { patterns: string[] };
}

interface WorkspaceStyle {
	logo?: SVG;
	logoDark?: SVG;
	css?: string;
}

export interface ModuleOptions {
	quiz?: boolean;
	styleGuide?: boolean;
	guests?: boolean;
}

export interface EnterpriseWorkspaceConfig extends WorkspaceConfig {
	git: WorkspaceGit;
	style: WorkspaceStyle;
	modules?: ModuleOptions;
	plugins?: PluginConfig[];
	wordTemplates?: ExportTemplate[];
	pdfTemplates?: ExportTemplate[];
	/* deprecated use git.lfs instead */
	lfs?: { patterns: string[] };
}

interface UserSettings {
	source: GitSourceData;
	ai: AiServerConfig;
	workspace: EnterpriseWorkspaceConfig;
	from: string;
}

export type ExportTemplate = {
	title: string;
	bufferBase64: string;
};

export default UserSettings;
