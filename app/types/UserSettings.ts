import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { WorkspaceConfig } from "@ext/workspace/WorkspaceConfig";

export type UserSettingsSourceData = GitSourceData & { error: string; errorMessage: string; errorDescription: string };

interface UserSettings {
	storageData: UserSettingsSourceData;
	workspace: WorkspaceConfig;
	from: string;
}

export default UserSettings;
