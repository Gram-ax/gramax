import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";

let callbackId = 0;
const callbacks = {};

export const callGitWasm = async <O>(command: string, args?): Promise<O> => {
	const promise = new Promise((resolve, reject) => {
		callbacks[++callbackId] = {
			resolve,
			reject,
		};
	});

	window.wasm.postMessage({
		type: "git-call",
		command,
		args,
		callbackId,
	});
	const data = (await promise) as any;
	if (!data.ok) {
		let message = typeof data.res === "string" ? data.res : data.res.message;
		if (args?.creds?.accessToken) {
			message = typeof message === "string" ? message.replace(args.creds.accessToken, "<redacted>") : message;
			args.creds.accessToken = "<redacted>";
		}

		throw new LibGit2Error(
			`git (${command}, ${data.res.class ?? "<unknown class>"}, ${data.res.code ?? "<unknown code>"})`,
			`${message?.trim()}\nArgs: ${JSON.stringify(args, null, 4)}`,
			data.res.class,
			data.res.code,
			command,
		);
	}
	return data.res;
};

export const onGitWasmCallback = (ev) => {
	if (!(ev.data.type == "git-call" && ev.data.callbackId)) return;

	const promise = callbacks[ev.data.callbackId];
	delete callbacks[ev.data.callbackId];
	promise.resolve(ev.data);
};
