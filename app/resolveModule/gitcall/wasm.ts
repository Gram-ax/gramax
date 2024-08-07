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
	(window as any).wasm.postMessage({
		type: "git-call",
		command,
		args,
		callbackId,
	});
	const data = (await promise) as any;
	if (!data.ok) throw new LibGit2Error(data.res.message, data.res.class, data.res.code);
	return data.res;
};

export const onGitWasmCallback = (ev) => {
	if (!(ev.data.type == "git-call" && ev.data.callbackId)) return;
	const promise = callbacks[ev.data.callbackId];
	delete callbacks[ev.data.callbackId];
	promise.resolve(ev.data);
};
