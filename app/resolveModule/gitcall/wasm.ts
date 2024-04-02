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
	return (await promise) as O;
};

export const onGitWasmCallback = (ev) => {
	if (!(ev.data.type == "git-call" && ev.data.callbackId)) return;
	const promise = callbacks[ev.data.callbackId];
	delete callbacks[ev.data.callbackId];
	const res = ev.data.res;
	if (!ev.data.ok) return promise.reject(new LibGit2Error(res.message, res.class, res.code));
	promise.resolve(ev.data.res);
};
