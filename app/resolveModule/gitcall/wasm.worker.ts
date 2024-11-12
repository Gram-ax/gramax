import { str2ptr } from "../../../apps/browser/wasm/js/utils";

const w = self as any;
const TOKEN_KEY = 2;
const GIT_SERVER_USERNAME_KEY = 3;
const PROTOCOL_KEY = 4;

const callInternal = async (command: string, args?: any): Promise<number> => {
	const ptr = await str2ptr(JSON.stringify(args));
	if (args?.creds?.accessToken) await w.store(TOKEN_KEY, args.creds.accessToken);
	if (args?.creds?.gitServerUsername) await w.store(GIT_SERVER_USERNAME_KEY, args.creds.gitServerUsername);
	if (args?.creds?.protocol) await w.store(PROTOCOL_KEY, args.creds.protocol);
	return await w.wasm["_" + command](...ptr);
};

export const callGit = callInternal;
