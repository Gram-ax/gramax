enum GitErrorCode {
	RemoteNotFoundMessageError = "RemoteNotFoundMessageError",
	CurrentBranchNotFoundError = "CurrentBranchNotFoundError",
	NetworkConntectionError = "NetworkConntectionError",
	MergeNotSupportedError = "MergeNotSupportedError",
	CantGetConflictedFiles = "CantGetConflictedFiles",
	CheckoutSubmoduleError = "CheckoutSubmoduleError",
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
	FileNotFoundError = "FileNotFoundError",
}

export default GitErrorCode;
