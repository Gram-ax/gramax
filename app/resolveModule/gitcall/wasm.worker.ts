import { type CredsArgs } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import { ptr2str, str2ptr } from "../../../apps/browser/wasm/js/utils";

const w = self as any;

const JSON_OPEN_PAREN = ['"', "{", "["];

const callInternal = async <O>(command: string, args?: any): Promise<O> => {
	const ptr = await str2ptr(JSON.stringify(args));
	w.token = args?.creds?.accessToken;

	try {
		let r_ptr = await w.wasm["_" + command](...ptr);
		if (typeof w.wasm.Asyncify == "object" && w.wasm.Asyncify.currData) r_ptr = await w.wasm.Asyncify.whenDone();
		const str_res = ptr2str(r_ptr);

		return (JSON_OPEN_PAREN.includes(str_res?.[0]) ? JSON.parse(str_res) : str_res) ?? {};
	} catch (err) {
		if ((args as CredsArgs)?.creds?.accessToken) (args as CredsArgs).creds.accessToken = "<redacted>";
		console.error(`git-command ${command} ${JSON.stringify(args, null, 4)} returned an error`);
		console.error(err);
		const error = JSON.parse(err);
		return error;
	}
};

export const callGit = callInternal;
