import { onCloneProgress, type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import git from "../../../apps/next/crates/next-gramax-git";

const tryParse = (data: any) => {
	try {
		return JSON.parse(data);
	} catch (err) {
		return data;
	}
};

export const call = <O>(command: string, args?: any): Promise<O> => {
	if (command == "clone") {
		args.callback = (val: string) => onCloneProgress(JSON.parse(val));
	}

	if (typeof args.scope !== "undefined") args.scope = intoTreeReadScope(args.scope);

	try {
		const result = git[command](...Object.values(args).filter((p) => p !== undefined && p !== null));
		if (result.stack) throw result;
		return Promise.resolve(typeof result === "string" ? JSON.parse(result) : result);
	} catch (err) {
		let error = typeof err === "string" ? tryParse(err) : err;
		error = err.stack ? tryParse(err.message) : error;
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		console.error(`git-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(error);
		return Promise.reject(new LibGit2Error(error?.message || error, error.class, error.code));
	}
};

const intoTreeReadScope = (data: any) => {
	if (!data) return { objectType: "Head", reference: null };
	if (data.commit) return { objectType: "Commit", reference: data.commit };
	if (data.reference) return { objectType: "Reference", reference: data.reference };
};
