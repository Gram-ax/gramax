enum GitErrorCode {
	RemoteNotFoundMessageError = "RemoteNotFoundMessageError",
	CurrentBranchNotFoundError = "CurrentBranchNotFoundError",
	NetworkConntectionError = "NetworkConntectionError",
	MergeNotSupportedError = "MergeNotSupportedError",
	CantGetConflictedFiles = "CantGetConflictedFiles",
	CheckoutConflictError = "CheckoutConflictError",
	DeleteCurrentBranch = "DeleteCurrentBranch",
	MergeConflictError = "MergeConflictError",
	AlreadyExistsError = "AlreadyExistsError",
	WorkingDirNotEmpty = "WorkingDirNotEmpty",
	PushRejectedError = "PushRejectedError",
	NotFoundError = "NotFoundError",
	GitPushError = "GitPushError",
	CloneError = "CloneError",
	MergeError = "MergeError",
	HttpError = "HttpError",
}

export default GitErrorCode;
