import { cloneProgressCallbacks, type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import git from "../../../apps/next/crates/next-gramax-git";

const tryParse = (data: any) => {
	try {
		return JSON.parse(data);
	} catch (err) {
		return data;
	}
};

export const call = async <O>(command: string, args?: any): Promise<O> => {
	let stringifiedArgs = null;

	if (command == "clone")
		args.callback = (_, val: string) => cloneProgressCallbacks[args.opts.cancelToken]?.(JSON.parse(val));
	if (command == "diff") stringifiedArgs = JSON.stringify(args);

	if (typeof args.scope !== "undefined") args.scope = intoTreeReadScope(args.scope);

	try {
		const promise = stringifiedArgs
			? git[command](stringifiedArgs)
			: git[command](...Object.values(args).filter((p) => p !== undefined && p !== null));
		const result = await promise;
		if (result?.stack) throw result;
		return Promise.resolve(typeof result === "string" ? JSON.parse(result) : result);
	} catch (err) {
		let error = typeof err === "string" ? tryParse(err) : err;
		error = err.stack ? tryParse(err.message) : error;
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		return Promise.reject(
			new LibGit2Error(
				`git (${command})`,
				`${error?.message?.trim() || error}\nArgs: ${JSON.stringify(args, null, 4)}`,
				error.class,
				error.code,
			),
		);
	}
};

const intoTreeReadScope = (data: any) => {
	if (!data || data === "HEAD") return { objectType: "Head", reference: null };
	if (data.commit) return { objectType: "Commit", reference: data.commit };
	if (data.reference) return { objectType: "Reference", reference: data.reference };
};
