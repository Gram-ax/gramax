import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";

export type UserSettingsSourceData = GitSourceData & {error: string, errorMessage: string, errorDescription: string}

interface UserSettings {
	storageData: UserSettingsSourceData;
	from: string;
}

export default UserSettings;
