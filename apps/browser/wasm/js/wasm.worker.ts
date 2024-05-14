import { callFS } from "@app/resolveModule/fscall/wasm.worker";
import { callGit } from "@app/resolveModule/gitcall/wasm.worker";
import WasmModule from "../dist/gramax-wasm";

(self as any).wasm = await WasmModule({});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
addEventListener("message", async (ev) => {
	let res: any;
	let ok = true;

	if (ev.data.type == "fs-call") {
		res = await callFS(ev.data.command, ev.data.args);
		ok = !(res?.message && res?.name);
	}

	if (ev.data.type == "git-call") {
		res = await callGit(ev.data.command, ev.data.args);
		ok = !(typeof res?.code != "undefined" && res?.class);
	}

	if (ev.data.type == "set-proxy") {
		(self as any).corsProxy = ev.data.corsProxy;
	}

	self.postMessage({ ok, res, callbackId: ev.data.callbackId, type: ev.data.type });
});

(self as any).onCloneProgress = (progress: string) => {
	self.postMessage({ type: "clone-progress", progress: JSON.parse(progress) });
};

self.postMessage({ type: "ready" });
