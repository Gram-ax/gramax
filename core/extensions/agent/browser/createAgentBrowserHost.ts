import { getExecutingEnvironment } from "@app/resolveModule/env";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import { getCachedSetting } from "@ext/settings/logic/cachedSettingsStore";
import type {
	AgentBrowserElementSnapshot,
	AgentBrowserHost,
	AgentBrowserPageSnapshot,
	AgentBrowserSessionMeta,
} from "../browser/browserHost";
import { unsupportedAgentBrowserHost } from "../browser/browserHost";

type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

declare global {
	interface Window {
		// biome-ignore lint/style/useNamingConvention: Tauri injects this global under an uppercase name
		__TAURI__?: {
			core?: {
				invoke?: TauriInvoke;
			};
		};
	}
}

const getTauriInvoke = (): TauriInvoke | null => {
	if (typeof window === "undefined") return null;
	return window.__TAURI__?.core?.invoke ?? null;
};

class TauriAgentBrowserHost implements AgentBrowserHost {
	constructor(private readonly _invoke: TauriInvoke) {}

	ensureSession(agentSessionId: string): Promise<AgentBrowserSessionMeta> {
		return this._pluginInvoke("ensure_session", {
			agentSessionId,
			language: resolveLanguage(getCachedSetting("general.language")),
		});
	}

	navigate(agentSessionId: string, url: string): Promise<AgentBrowserPageSnapshot> {
		return this._pluginInvoke("navigate", { agentSessionId, url });
	}

	readPage(agentSessionId: string): Promise<AgentBrowserPageSnapshot> {
		return this._pluginInvoke("read_page", { agentSessionId });
	}

	readElement(agentSessionId: string, elementId: string): Promise<AgentBrowserElementSnapshot> {
		return this._pluginInvoke("read_element", { agentSessionId, elementId });
	}

	click(agentSessionId: string, elementId: string): Promise<AgentBrowserPageSnapshot> {
		return this._pluginInvoke("click", { agentSessionId, elementId });
	}

	type(agentSessionId: string, elementId: string, text: string): Promise<AgentBrowserPageSnapshot> {
		return this._pluginInvoke("type", { agentSessionId, elementId, text });
	}

	scroll(agentSessionId: string): Promise<AgentBrowserPageSnapshot> {
		return this._pluginInvoke("scroll", { agentSessionId });
	}

	reveal(agentSessionId: string): Promise<AgentBrowserSessionMeta> {
		return this._pluginInvoke("reveal", { agentSessionId });
	}

	async teardown(agentSessionId: string): Promise<void> {
		await this._pluginInvoke("teardown", { agentSessionId });
	}

	getSessionMeta(agentSessionId: string): Promise<AgentBrowserSessionMeta> {
		return this._pluginInvoke("get_session_meta", { agentSessionId });
	}

	private _pluginInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
		return this._invoke(`plugin:plugin-browser-session|${command}`, args);
	}
}

export const createAgentBrowserHost = (): AgentBrowserHost => {
	if (getExecutingEnvironment() !== "tauri") {
		return unsupportedAgentBrowserHost;
	}

	const invoke = getTauriInvoke();
	if (!invoke) {
		return unsupportedAgentBrowserHost;
	}

	return new TauriAgentBrowserHost(invoke);
};
