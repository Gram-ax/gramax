import { callRust } from "@app/resolveModule/rustcall/wasm.worker";
import type { RemoteProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type { Span } from "@ext/loggers/opentelemetry/span";
import WasmModule from "../dist/gramax-wasm";
import { ptr2bytes, ptr2str, str2ptr } from "./utils";

const RAW_BYTES_COMMANDS = ["read_file", "git_read_file"];
const decoder = new TextDecoder();
const CORS_PROXY_KEY = 1;

const self = global.self as typeof global.self & {
	on_done: (callbackId: number, ptr: number) => void;
	send_otel: (spans: Span[]) => void;
	onRemoteProgress: (data: RemoteProgress) => void;
	wasm: unknown;
	store: (key: number, value: string) => Promise<void>;
	getStore: (key: number) => string;
};

export type WasmCallback = { command: string; callbackId: number };

const callbacks: { [id: number]: WasmCallback } = {};

const init = async () => {
	try {
		self.wasm = await Promise.race([
			WasmModule(),
			new Promise((_, reject) => setTimeout(() => reject(new Error("wasm init timed out")), 10_000)),
		]);
	} catch (error) {
		self.postMessage({ type: "timeout" });
		throw error;
	}

	self.store = async (key: number, value: string): Promise<void> => {
		const [len, ptr] = await str2ptr(value);
		self.wasm._store(key, len, ptr);
	};

	self.getStore = (key: number): string => {
		const ptr = self.wasm._get_store(key);
		const str = ptr2str(ptr);
		return str?.buf;
	};

	self.send_otel = (spans: Span[]) => {
		self.postMessage({ type: "otel", spans });
	};

	self.on_done = (innerCallbackId: number, ptr: number) => {
		const { command, callbackId } = callbacks[innerCallbackId] || {};
		delete callbacks[innerCallbackId];

		if (!command) return;

		const type = "call";

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

	self.onRemoteProgress = (data) => {
		self.postMessage({ type: "remote-progress", data });
	};

	const broadcast = new BroadcastChannel("pthreads-broadcast");

	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	self.addEventListener("message", async (ev) => {
		if (ev.data.type === "call") {
			const id = await callRust(ev.data.namespace, ev.data.command, ev.data.args);
			callbacks[id] = { callbackId: ev.data.callbackId, command: ev.data.command };

			if (ev.data.namespace === "git" && ev.data.command === "cancel")
				broadcast.postMessage({ type: "cancel", id: ev.data.args.id, date: Date.now() });
			return;
		}

		if (ev.data.type === "set-proxy") {
			await self.store(CORS_PROXY_KEY, ev.data.corsProxy);
			return;
		}

		if (ev.data.type === "set-otel-level") {
			(self.wasm as Record<string, (rank: number) => void>)._otel_set_level(ev.data.rank);
			return;
		}
	});

	self.postMessage({ type: "ready" });
};

void init();
