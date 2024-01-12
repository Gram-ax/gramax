import { Caller } from "../../../GitCommands/errors/model/Caller";
import GitErrorCode from "../../../GitCommands/errors/model/GitErrorCode";
import GitErrorContextProps from "../../../GitCommands/errors/model/GitErrorContextProps";
import GitError from "../GitError";

const getGitError = (
	error: any,
	gitErrorProps: Partial<GitErrorContextProps> & { [key: string]: any },
	caller?: Caller,
): GitError => {
	return error.code in GitErrorCode
		? new GitError(GitErrorCode[error.code], error, gitErrorProps, caller)
		: new GitError(null, error, gitErrorProps, caller);
};

export default getGitError;
