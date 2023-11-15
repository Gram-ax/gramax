import GitError from "../GitError";
import { Caller } from "../model/Caller";
import GitErrorCode from "../model/GitErrorCode";
import GitErrorContextProps from "../model/GitErrorContextProps";

const getGitError = (
	error: any,
	gitErrorProps: Partial<GitErrorContextProps> & { [key: string]: any },
	caller?: Caller
): GitError => {
	return error.code in GitErrorCode
		? new GitError(GitErrorCode[error.code], error, gitErrorProps, caller)
		: new GitError(null, error, gitErrorProps, caller);
};

export default getGitError;
