import { alloc, str2ptr } from "../../../apps/browser/crates/gramax-wasm/js/utils";
import type { Namespace } from "./index";

interface WasmWorkerGlobal {
	wasm: Record<string, (...args: number[]) => Promise<number>>;
	store: (key: number, value: string) => Promise<void>;
}
const w = self as typeof self & WasmWorkerGlobal;

const TOKEN_KEY = 2;
const GIT_SERVER_USERNAME_KEY = 3;
const PROTOCOL_KEY = 4;
const GIT_COMMANDS_UPDATE_CREDS = ["fetch", "clone", "push"];

const fsArgs = async (cmd: string, args?: Record<string, unknown>): Promise<number[]> => {
	if (cmd === "write_file") {
		const content = args?.content;
		const buf = new Uint8Array(typeof content === "string" ? Buffer.from(content) : (content as Uint8Array));
		return str2ptr(
			JSON.stringify({
				scope: args?.scope,
				path: args?.path,
				contentLen: buf.byteLength,
				contentPtr: await alloc(buf),
				compress: args?.compress ?? null,
			}),
		);
	}
	return str2ptr(JSON.stringify(args));
};

// biome-ignore lint/suspicious/noExplicitAny: args vary
const gitArgs = async (cmd: string, args: any): Promise<number[]> => {
	if (args?.scope === "HEAD") args.scope = null;
	const ptr = await str2ptr(JSON.stringify(args));
	if (GIT_COMMANDS_UPDATE_CREDS.includes(cmd)) {
		await w.store(TOKEN_KEY, args?.creds?.accessToken || "");
		await w.store(GIT_SERVER_USERNAME_KEY, args?.creds?.username || "");
		await w.store(PROTOCOL_KEY, args?.creds?.protocol || "");
	}
	return ptr;
};

export const callRust = async (
	namespace: Namespace,
	command: string,
	// biome-ignore lint/suspicious/noExplicitAny: args vary
	args?: any,
): Promise<number> => {
	const ptr = namespace === "git" ? await gitArgs(command, args) : await fsArgs(command, args);
	return w.wasm[`_${command}`](...ptr);
};
