import type { AgentBrowserHost, AgentBrowserPageSnapshot, AgentBrowserSessionMeta } from "./browserHost";

type BrowserAwareSession = {
	id: string;
	browser: AgentBrowserSessionMeta;
};

export const ensureBrowserSession = async (
	session: BrowserAwareSession,
	host: AgentBrowserHost,
): Promise<AgentBrowserSessionMeta> => {
	session.browser = await host.ensureSession(session.id);
	return session.browser;
};

export const markBrowserSessionActive = (
	session: BrowserAwareSession,
	snapshot: AgentBrowserPageSnapshot,
): AgentBrowserPageSnapshot => {
	session.browser = { active: true, visible: session.browser.visible };
	return snapshot;
};
