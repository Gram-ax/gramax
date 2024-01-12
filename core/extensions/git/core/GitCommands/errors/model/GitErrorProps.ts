import { Caller } from "@ext/git/core/GitCommands/errors/model/Caller";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitErrorContextProps from "@ext/git/core/GitCommands/errors/model/GitErrorContextProps";

type GitErrorProps = Partial<GitErrorContextProps> & {
	[key: string]: any;
	errorCode: GitErrorCode;
	errorData: any;
	caller: Caller;
};

export default GitErrorProps;
