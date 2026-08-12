import "./types";

if (!window.__gxAgentBrowserDebugInstalled) {
	window.__gxAgentBrowserDebugInstalled = true;

	const MAX_MESSAGE_LENGTH = 500;
	const MAX_BUFFER_LENGTH = 50;
	window.__gxAgentBrowserDebugBuffer = window.__gxAgentBrowserDebugBuffer || [];
	const debugBuffer = window.__gxAgentBrowserDebugBuffer;
	const core = window.__TAURI__?.core;

	const truncate = (value: unknown): string => {
		const text = String(value ?? "");
		return text.length > MAX_MESSAGE_LENGTH ? `${text.slice(0, MAX_MESSAGE_LENGTH)}...` : text;
	};

	const serializeValue = (value: unknown): string => {
		if (value instanceof Error) {
			return truncate(`${value.name}: ${value.message}\n${value.stack || ""}`);
		}
		if (typeof value === "string") {
			return truncate(value);
		}
		try {
			return truncate(JSON.stringify(value));
		} catch (_) {
			return truncate(String(value));
		}
	};

	const record = async (kind: string, values: unknown[]): Promise<void> => {
		const message = `[${kind}] ${values.map(serializeValue).join(" ")}`;
		debugBuffer.push(message);
		if (debugBuffer.length > MAX_BUFFER_LENGTH) {
			debugBuffer.shift();
		}
		if (!core?.invoke) {
			return;
		}
		try {
			await core.invoke("plugin:plugin-browser-session|debug_log", {
				label: window.location.href,
				message,
			});
		} catch (_) {}
	};

	for (const level of ["log", "info", "warn", "error", "debug"] as const) {
		const original = console[level]?.bind(console);
		if (!original) {
			continue;
		}
		console[level] = (...args: unknown[]) => {
			void record(`console.${level}`, args);
			original(...args);
		};
	}

	window.addEventListener("error", (event) => {
		void record("window.error", [
			event.message,
			event.filename,
			`line=${event.lineno}`,
			`column=${event.colno}`,
			event.error,
		]);
	});

	window.addEventListener("unhandledrejection", (event) => {
		void record("window.unhandledrejection", [event.reason]);
	});

	document.addEventListener("readystatechange", () => {
		void record("document.readystatechange", [document.readyState, window.location.href]);
	});

	window.addEventListener("DOMContentLoaded", () => {
		void record("window.dom-content-loaded", [document.readyState, window.location.href]);
	});

	window.addEventListener("load", () => {
		void record("window.load", [document.readyState, window.location.href]);
	});

	void record("debug-script-installed", [
		document.readyState,
		window.location.href,
		`tauriCore=${Boolean(core?.invoke)}`,
	]);
}
