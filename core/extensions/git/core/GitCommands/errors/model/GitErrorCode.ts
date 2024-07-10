enum GitErrorCode {
	RemoteNotFoundMessageError = "RemoteNotFoundMessageError",
	CurrentBranchNotFoundError = "CurrentBranchNotFoundError",
	MergeNotSupportedError = "MergeNotSupportedError",
	CantGetConflictedFiles = "CantGetConflictedFiles",
	CheckoutConflictError = "CheckoutConflictError",
	DeleteCurrentBranch = "DeleteCurrentBranch",
	MergeConflictError = "MergeConflictError",
	AlreadyExistsError = "AlreadyExistsError",
	WorkingDirNotEmpty = "WorkingDirNotEmpty",
	PushRejectedError = "PushRejectedError",
	CloneError404 = "CloneError404",
	NotFoundError = "NotFoundError",
	GitPushError = "GitPushError",
	CloneError = "CloneError",
	MergeError = "MergeError",
	HttpError = "HttpError",
}

export default GitErrorCode;
