import { getExecutingEnvironment } from "@app/resolveModule/env";

// biome-ignore lint/suspicious/noExplicitAny: args vary per backend
export type RustCallFn = <O>(command: string, args?: any) => Promise<O>;
export type Namespace = "fs" | "git";

export const parseCommand = (command: string): [Namespace, string] => {
	const dot = command.indexOf(".");
	if (dot <= 0)
		throw new Error(`rustCall: command must be namespaced as "fs.<cmd>" or "git.<cmd>", got "${command}"`);
	const namespace = command.slice(0, dot) as Namespace;
	if (namespace !== "fs" && namespace !== "git") throw new Error(`rustCall: unknown namespace "${namespace}"`);
	const cmd = command.slice(dot + 1);
	if (!cmd) throw new Error(`rustCall: empty subcommand for namespace "${namespace}"`);
	return [namespace, cmd];
};

let init: Promise<void> | null = null;
let call: RustCallFn = null;

export const initRustCall = async (): Promise<void> => {
	if (init) return init;

	init = (async () => {
		const env = getExecutingEnvironment();

		switch (env) {
			case "browser": {
				const { callWasm } = await import("./wasm");
				call = callWasm;
				break;
			}

			case "tauri": {
				const { call: tauriCall } = await import("./tauri");
				call = tauriCall;
				break;
			}

			case "static": {
				const { staticCall } = await import("./static");
				call = staticCall;
				break;
			}

			case "cli": {
				const { cliCall } = await import("./cli");
				call = cliCall;
				break;
			}

			case "next": {
				const { call: nextCall } = await import("./next");
				call = nextCall;
				break;
			}

			case "test":
				break;

			default:
				throw new Error(`unsupported env: ${env}`);
		}
	})();

	return init;
};

// biome-ignore lint/suspicious/noExplicitAny: args vary per backend
const rustCall = async <O>(command: string, args?: any): Promise<O> => {
	await initRustCall();
	return call<O>(command, args);
};

export default rustCall;
