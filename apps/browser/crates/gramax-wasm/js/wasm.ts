import { onFSWasmCallback } from "@app/resolveModule/fscall/wasm";
import { onGitWasmCallback } from "@app/resolveModule/gitcall/wasm";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { progress } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import setWorkerProxy from "../../../src/logic/setWorkerProxy";

const notSupported = () => new DefaultError(undefined, undefined, { errorCode: "wasmInitTimeout" });
const notHttps = () => new DefaultError(undefined, undefined, { errorCode: "notHttps" });

const assertSupported = () => {
	const supported =
		typeof window !== "undefined" &&
		window.navigator.storage &&
		window.SharedArrayBuffer &&
		window.WebAssembly &&
		window.Worker;
	if (!supported) throw notSupported();
};

const assertHttps = () => {
	if (!window.isSecureContext || !window.crossOriginIsolated) throw notHttps();
};

const assertPersisted = async () => {
	if (await window.navigator.storage.persisted()) return;
	await window.navigator.storage.persist();
};

export const initWasm = async (corsProxy: string) => {
	assertHttps();
	assertSupported();
	await assertPersisted();
	const w = window as any;
	w.wasm = new Worker(new URL("./wasm.worker.ts", import.meta.url), { type: "module" });
	await new Promise((resolve, reject) => {
		setTimeout(() => reject(notSupported()), 20000);
		w.wasm.onerror = (err) => reject(err);
		w.wasm.addEventListener("message", (ev) => {
			if (ev.data.type == "fs-call") onFSWasmCallback(ev);
			if (ev.data.type == "git-call") onGitWasmCallback(ev);
			if (ev.data.type == "remote-progress") {
				const payload = ev.data?.data;
				if (!payload?.data) return;
				progress[payload.data.id]?.(payload);
			}

			if (ev.data.type == "ready") resolve(w.wasm);
		});
	});

	setWorkerProxy(corsProxy);
};
