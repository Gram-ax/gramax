import { AiData } from "@ext/ai/models/types";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";

export enum AuthMethod {
	SSO = "sso",
	GUEST_MAIL = "guest_mail",
}

type SVG = string;

interface WorkspaceSource {
	type: SourceType;
	url: string;
	repos: string[];
}

interface WorkspaceStyle {
	logo?: SVG;
	logoDark?: SVG;
	css?: string;
}

export interface EnterpriseWorkspaceConfig extends WorkspaceConfig {
	source: WorkspaceSource;
	style: WorkspaceStyle;
	authMethods: AuthMethod[];
}

interface UserSettings {
	source: GitSourceData;
	ai: AiData;
	workspace: EnterpriseWorkspaceConfig;
	from: string;
	isNotEditor?: boolean;
}

export default UserSettings;
