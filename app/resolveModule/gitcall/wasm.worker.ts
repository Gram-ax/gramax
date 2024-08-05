import { JSErrorClass } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import { type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { ptr2str, str2ptr } from "../../../apps/browser/wasm/js/utils";

const w = self as any;

const JSON_OPEN_PAREN = ['"', "{", "["];

const callInternal = async <O>(command: string, args?: any): Promise<O> => {
	const ptr = await str2ptr(JSON.stringify(args));
	w.token = args?.creds?.accessToken;
	w.gitServerUsername = args?.creds?.gitServerUsername;

	try {
		const r_ptr = await w.wasm["_" + command](...ptr);
		const str_res = ptr2str(r_ptr);
		if (!str_res.ok) throw str_res.buf;

		return (
			(JSON_OPEN_PAREN.includes(str_res.buf?.[0]) || str_res.buf == "null"
				? JSON.parse(str_res.buf)
				: str_res?.buf) ?? {}
		);
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		console.error(`git-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(err);
		if (err instanceof Error) {
			return { message: err.message, code: (err as any).code, class: JSErrorClass } as any;
		}
		const error = JSON.parse(err);
		return error;
	}
};

export const callGit = callInternal;
