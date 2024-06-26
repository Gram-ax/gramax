import { onFSWasmCallback } from "@app/resolveModule/fscall/wasm";
import { onGitWasmCallback } from "@app/resolveModule/gitcall/wasm";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { onCloneProgress } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";

const notSupported = () => new DefaultError(undefined, undefined, { errorCode: "wasmInitTimeout" });

const assertSupported = () => {
	const supported = typeof window !== "undefined" && window.SharedArrayBuffer && window.WebAssembly && window.Worker;
	if (!supported) throw notSupported();
};

export const initWasm = async (corsProxy: string) => {
	assertSupported();
	const w = window as any;
	w.wasm = new Worker(new URL("./wasm.worker.ts", import.meta.url), { type: "module" });
	await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(notSupported()), 50000);
		w.wasm.addEventListener("message", (ev) => {
			if (ev.data.type == "fs-call") onFSWasmCallback(ev);
			if (ev.data.type == "git-call") onGitWasmCallback(ev);
			if (ev.data.type == "clone-progress") {
				const payload = ev.data.progress;
				onCloneProgress?.({
					phase: "receiving-objects",
					percent: (payload.received / payload.total) * 100,
					loaded: payload.received as number,
					total: payload.total as number,
				});
			}

			if (ev.data.type == "ready") {
				clearTimeout(timeout);
				resolve(w.wasm);
			}
		});
	});

	w.wasm.postMessage({ type: "set-proxy", corsProxy });
};
