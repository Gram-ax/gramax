declare global {
	interface Window {
		// biome-ignore lint/style/useNamingConvention: external global injected by Tauri
		__TAURI__?: {
			core?: {
				invoke?: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
			};
		};
		// biome-ignore lint/style/useNamingConvention: guard flag injected via init script
		__gxAgentBrowserDebugInstalled?: boolean;
		// biome-ignore lint/style/useNamingConvention: debug ring-buffer exposed on window
		__gxAgentBrowserDebugBuffer?: string[];
		// biome-ignore lint/style/useNamingConvention: bridge object injected by app frame
		__gxAgentBrowser?: {
			handleRequest: (request: AgentBrowserRequest) => Promise<unknown>;
		};
		// biome-ignore lint/style/useNamingConvention: DOM snapshot cache exposed on window
		__gxAgentBrowserLastElements?: Record<string, InteractiveElementInfo>;
		// biome-ignore lint/style/useNamingConvention: SDK instance injected by init script
		__gxBrowserAgent?: BrowserAgentSdk;
	}
}

export interface AgentBrowserRequest {
	action: string;
	payload: Record<string, unknown>;
}

export interface InteractiveElementInfo {
	tag: string;
	text: string;
	href?: string;
	src?: string;
	placeholder?: string;
	disabled?: true;
}

export interface BrowserAgentSdk {
	executeExpression: (requestId: string, expression: string) => void;
	executeAction: (requestId: string, request: AgentBrowserRequest) => void;
}
