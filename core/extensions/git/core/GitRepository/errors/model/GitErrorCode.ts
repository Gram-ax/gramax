enum GitErrorCode {
	RemoteNotFoundMessageError = "RemoteNotFoundMessageError",
	CurrentBranchNotFoundError = "CurrentBranchNotFoundError",
	MergeNotSupportedError = "MergeNotSupportedError",
	CheckoutConflictError = "CheckoutConflictError",
	DeleteCurrentBranch = "DeleteCurrentBranch",
	MergeConflictError = "MergeConflictError",
	AlreadyExistsError = "AlreadyExistsError",
	WorkingDirNotEmpty = "WorkingDirNotEmpty",
	PushRejectedError = "PushRejectedError",
	NotFoundError = "NotFoundError",
	GitPushError = "GitPushError",
	MergeError = "MergeError",
	HttpError = "HttpError",
}

export default GitErrorCode;
