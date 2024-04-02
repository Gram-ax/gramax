import { type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import git from "../../../apps/next/rlibs/next-gramax-git";

export const call = async <O>(command: string, args?: any): Promise<O> => {
	try {
		return await git[command](...Object.values(args).filter((p) => p !== undefined && p !== null)) as O;
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		console.error(`git-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(err);
		throw new LibGit2Error(err.message, err.class, err.code);
	}
};
