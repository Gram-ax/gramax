import { getExecutingEnvironment } from "@app/resolveModule/env";

type GitCallFn = <O>(command: string, args?: any) => Promise<O>;

let init: Promise<void> | null = null;
let call: GitCallFn = null;

export const initGitCall = async (): Promise<void> => {
	if (init as any) return init;

	init = (async () => {
		const environment = getExecutingEnvironment();

		switch (environment) {
			case "browser":
				const { callGitWasm } = await import("./wasm");
				call = callGitWasm;
				break;

			case "next":
				const { call: nextCall } = await import("./next");
				call = nextCall;
				break;

			case "tauri":
				const { call: tauriCall } = await import("./tauri");
				call = tauriCall;
				break;

			case "test":
				const { call: testCall } = await import("./next");
				call = testCall;
				break;

			case "static":
				const { call: staticCall } = await import("./static");
				call = staticCall;
				break;

			case "cli":
				const { call: cliCall } = await import("./cli");
				call = cliCall;
				break;

			default:
				throw new Error(`unsupported env: ${environment}`);
		}
	})();

	return init;
};

const resolveCall = async <O>(command: string, args?: any): Promise<O> => {
	await initGitCall();
	return call<O>(command, args);
};

export default resolveCall;
