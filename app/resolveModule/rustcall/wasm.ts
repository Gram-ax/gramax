/** biome-ignore-all lint/suspicious/noExplicitAny: cross-thread postMessage payloads */
import IoError from "@core/FileProvider/DiskFileProvider/DFPIOError";
import { healthcheckEvents } from "@ext/git/core/GitCommands/errors/HealthcheckEvents";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import { span } from "@ext/loggers/opentelemetry";
import { parseCommand } from "./index";

let callbackId = 0;
const callbacks: Record<number, { resolve: (data: any) => void; reject: (err: unknown) => void }> = {};

export const callWasm = async <O>(command: string, args: any = {}): Promise<O> => {
	const [namespace, cmd] = parseCommand(command);

	const promise = new Promise<any>((resolve, reject) => {
		callbacks[++callbackId] = { resolve, reject };
	});

	const ctx = span()?.spanContext();
	if (ctx) {
		args.spanId = ctx.spanId;
		args.traceId = ctx.traceId;
	}

	(window as any).wasm.postMessage({
		type: "call",
		namespace,
		command: cmd,
		args,
		callbackId,
	});

	const data = await promise;
	if (data.ok) return data.res;

	if (namespace === "git") {
		let message = typeof data.res === "string" ? data.res : data.res?.message;
		if (args?.creds?.accessToken) {
			message = typeof message === "string" ? message.replace(args.creds.accessToken, "<redacted>") : message;
			args.creds.accessToken = "<redacted>";
		}
		const libGit2Error = new LibGit2Error(
			`git (${cmd}, ${data.res?.subset ?? "<unknown subset>"}, ${data.res?.class ?? "<unknown class>"}, ${
				data.res?.code ?? "<unknown code>"
			})`,
			`${message?.trim()}\nArgs: ${JSON.stringify(args, null, 4)}`,
			data.res?.subset,
			data.res?.class,
			data.res?.code,
			cmd,
		);
		if (libGit2Error.code === GitErrorCode.HealthcheckFailed && args?.repoPath) {
			await healthcheckEvents.emit("healthcheck-failed", { repoPath: args.repoPath, error: libGit2Error });
		}
		throw libGit2Error;
	}

	const err = typeof data.res === "string" ? JSON.parse(data.res) : data.res;
	throw new IoError({
		name: `IO (${cmd})`,
		code: err?.name,
		message: `${err?.name}: ${err?.message};\nargs: ${JSON.stringify(args, null, 4)}`,
	});
};

export const onRustWasmCallback = (ev: MessageEvent) => {
	if (ev.data?.type !== "call" || !ev.data.callbackId) return;
	const promise = callbacks[ev.data.callbackId];
	delete callbacks[ev.data.callbackId];
	promise?.resolve(ev.data);
};
