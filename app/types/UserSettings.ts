import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";

export type UserSettingsSourceData = GitSourceData & { error: string; errorMessage: string; errorDescription: string };

interface UserSettings {
	source: UserSettingsSourceData;
	workspace: WorkspaceConfig;
	from: string;
	isNotEditor?: boolean;
}

export default UserSettings;
