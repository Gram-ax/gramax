import { onFSWasmCallback } from "@app/resolveModule/fscall/wasm";
import { onGitWasmCallback } from "@app/resolveModule/gitcall/wasm";

export const initWasm = async (corsProxy: string) => {
	const w = window as any;
	w.wasm = new Worker(new URL("./wasm.worker.ts", import.meta.url), { type: "module" });
	await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error("Worker init timed out")), 50_000);
		w.wasm.addEventListener("message", (ev) => {
			if (ev.data.type == "fs-call") onFSWasmCallback(ev);
			if (ev.data.type == "git-call") onGitWasmCallback(ev);

			if (ev.data.type == "ready") {
				clearTimeout(timeout);
				resolve(w.wasm);
			}
		});
	});

	w.wasm.postMessage({ type: "set-proxy", corsProxy });
};
