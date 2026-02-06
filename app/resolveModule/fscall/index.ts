import { getExecutingEnvironment } from "@app/resolveModule/env";

type FSCallFn = <O>(command: string, args?: any) => Promise<O>;

let init: Promise<void> | null = null;
let call: FSCallFn = null;

export const initFSCall = async (): Promise<void> => {
	if (init as any) return init;

	init = (async () => {
		const env = getExecutingEnvironment();

		switch (env) {
			case "browser": {
				const { callFSWasm } = await import("./wasm");
				call = callFSWasm;
				break;
			}

			case "tauri": {
				const { call: tauriCall } = await import("./tauri");
				call = tauriCall;
				break;
			}

			case "static": {
				const { StaticCall } = await import("./static");
				call = StaticCall;
				break;
			}

			case "cli": {
				const { CliCall } = await import("./cli");
				call = CliCall;
				break;
			}

			case "next":
			case "test":
				break;

			default:
				throw new Error(`unsupported env: ${env}`);
		}
	})();

	return init;
};

const resolveCall = async <O>(command: string, args?: any): Promise<O> => {
	await initFSCall();
	return call<O>(command, args);
};

export default resolveCall;
