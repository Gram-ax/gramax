import type { AgentBrowserRequest, BrowserAgentSdk } from "./types";

const RESOLVE_COMMAND = "plugin:plugin-browser-session|resolve_request";
const LOG_COMMAND = "plugin:plugin-browser-session|debug_log";

interface ResolvePayload {
	ok: boolean;
	result?: unknown;
	error?: string;
}

function getInvoke() {
	return window.__TAURI__?.core?.invoke;
}

async function sendLog(requestId: string, message: string): Promise<void> {
	const invoke = getInvoke();
	if (!invoke) return;
	try {
		await invoke(LOG_COMMAND, {
			label: window.location.href,
			message: `[${requestId}] ${message}`,
		});
	} catch (_) {}
}

async function resolveRequest(requestId: string, payload: ResolvePayload): Promise<void> {
	const invoke = getInvoke();
	if (!invoke) {
		throw new Error(`Tauri core.invoke is unavailable; keys=${Object.keys(window.__TAURI__ || {}).join(",")}`);
	}
	await invoke(RESOLVE_COMMAND, {
		requestId,
		payload: JSON.stringify(payload),
	});
}

async function runAndResolve(requestId: string, work: () => Promise<unknown>): Promise<void> {
	try {
		await sendLog(
			requestId,
			`script-start href=${window.location.href} readyState=${document.readyState} tauriCore=${Boolean(getInvoke())}`,
		);
		const result = await work();
		await sendLog(requestId, "script-success");
		await resolveRequest(requestId, { ok: true, result });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		await sendLog(requestId, `script-error:${message}`);
		await resolveRequest(requestId, { ok: false, error: message });
	}
}

const sdk: BrowserAgentSdk = {
	executeExpression(requestId: string, expression: string): void {
		void runAndResolve(requestId, () =>
			// eslint-disable-next-line no-new-func
			Promise.resolve(new Function(`return (${expression})`)()),
		);
	},

	executeAction(requestId: string, request: AgentBrowserRequest): void {
		void runAndResolve(requestId, async () => {
			const bridge = window.__gxAgentBrowser;
			if (!bridge?.handleRequest) {
				throw new Error("window.__gxAgentBrowser.handleRequest is unavailable");
			}
			return await Promise.resolve(bridge.handleRequest(request));
		});
	},
};

window.__gxBrowserAgent = sdk;
