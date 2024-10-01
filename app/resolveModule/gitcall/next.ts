import { onCloneProgress, type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import git from "../../../apps/next/rlibs/next-gramax-git";

let globalCounter = 0;

export const call = <O>(command: string, args?: any): Promise<O> => {
	try {
		if (command == "clone") {
			args.callback = (val) => onCloneProgress(JSON.parse(val));
		}

		const label = `Executing: ${command} with ${JSON.stringify({
			...args,
			creds: {
				...args.creds,
				...(args.creds?.accessToken ? { accessToken: "<redacted>" } : {}),
			},
		})} id {${globalCounter++}}`;
		console.time(label);
		const result = git[command](...Object.values(args).filter((p) => p !== undefined && p !== null));
		if (result instanceof Error) throw JSON.parse(result.message);
		console.timeEnd(label);
		return Promise.resolve(JSON.parse(result));
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		console.error(`git-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(err);
		return Promise.reject(new LibGit2Error(err.message, err.class, err.code));
	}
};
