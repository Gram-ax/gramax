import { callFS } from "@app/resolveModule/fscall/wasm.worker";
import { callGit } from "@app/resolveModule/gitcall/wasm.worker";
import WasmModule from "../dist/gramax-wasm";
import { ptr2bytes, ptr2str, str2ptr } from "./utils";

const RAW_BYTES_COMMANDS = ["read_file"];
const decoder = new TextDecoder();
const CORS_PROXY_KEY = 1;

const self = global.self as typeof global.self & {
	on_done: (callbackId: number, ptr: number) => void;
	onCloneProgress: (progress: any) => void;
	wasm: typeof WasmModule;
	store: (key: number, value: string) => Promise<void>;
	getStore: (key: number) => string;
};

self.store = async (key: number, value: string): Promise<void> => {
	const [len, ptr] = await str2ptr(value);
	self.wasm["_store"](key, len, ptr);
};

self.getStore = (key: number): string => {
	const ptr = self.wasm["_get_store"](key);
	const str = ptr2str(ptr);
	return str?.buf;
};

export type WasmCallback = { command: string; callbackId: number; type: "git-call" | "fs-call" };

const callbacks: { [id: number]: WasmCallback } = {};

self.on_done = (innerCallbackId: number, ptr: number) => {
	const { command, callbackId, type } = callbacks[innerCallbackId] || {};
	delete callbacks[innerCallbackId];

	if (!command) return;

	if (RAW_BYTES_COMMANDS.includes(command)) {
		const bytes = ptr2bytes(ptr);
		self.postMessage({ type, callbackId, ok: bytes.ok, res: bytes.ok ? bytes.buf : decoder.decode(bytes.buf) });
		return;
	}

	const str_res = ptr2str(ptr);
	if (!str_res) {
		self.postMessage({ type, callbackId, ok: false, res: undefined });
		return;
	}

	return self.postMessage({
		type,
		callbackId,
		ok: str_res.ok,
		res: str_res.buf ? JSON.parse(str_res.buf) : undefined,
	});
};

self.onCloneProgress = (progress) => {
	self.postMessage({ type: "clone-progress", progress });
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
self.addEventListener("message", async (ev) => {
	if (ev.data.type == "fs-call") {
		const id = await callFS(ev.data.command, ev.data.args);
		callbacks[id] = { callbackId: ev.data.callbackId, command: ev.data.command, type: ev.data.type };
		return;
	}

	if (ev.data.type == "git-call") {
		const id = await callGit(ev.data.command, ev.data.args);
		callbacks[id] = { callbackId: ev.data.callbackId, command: ev.data.command, type: ev.data.type };
		return;
	}

	if (ev.data.type == "set-proxy") {
		await self.store(CORS_PROXY_KEY, ev.data.corsProxy);
		return;
	}
});

self.wasm = await WasmModule({});

self.postMessage({ type: "ready" });
