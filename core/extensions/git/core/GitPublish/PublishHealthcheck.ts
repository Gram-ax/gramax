export enum PublishHealthcheckCode {
	Ok = "ok",
	ProtectedBranch = "protected-branch",
	PermissionsUnavailable = "permissions-unavailable",
	NoStorageConnected = "no-storage-connected",
	HasGitConflicts = "has-git-conflicts",
}

export type PublishHealthcheckResult = {
	code: PublishHealthcheckCode;
};
