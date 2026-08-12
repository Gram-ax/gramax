export type AgentBrowserInteractiveElement = {
	tag: string;
	text: string;
	href?: string;
	src?: string;
	placeholder?: string;
	disabled?: boolean;
};

export type AgentBrowserPageSnapshot = {
	url: string;
	title: string;
	accessibilityTree: string;
	isBottomReached: boolean;
};

export type AgentBrowserElementSnapshot = {
	elementId: string;
	element: AgentBrowserInteractiveElement | null;
};

export type AgentBrowserSessionMeta = {
	active: boolean;
	visible: boolean;
};

export interface AgentBrowserHost {
	ensureSession(agentSessionId: string): Promise<AgentBrowserSessionMeta>;
	navigate(agentSessionId: string, url: string): Promise<AgentBrowserPageSnapshot>;
	readPage(agentSessionId: string): Promise<AgentBrowserPageSnapshot>;
	readElement(agentSessionId: string, elementId: string): Promise<AgentBrowserElementSnapshot>;
	click(agentSessionId: string, elementId: string): Promise<AgentBrowserPageSnapshot>;
	type(agentSessionId: string, elementId: string, text: string): Promise<AgentBrowserPageSnapshot>;
	scroll(agentSessionId: string): Promise<AgentBrowserPageSnapshot>;
	reveal(agentSessionId: string): Promise<AgentBrowserSessionMeta>;
	teardown(agentSessionId: string): Promise<void>;
	getSessionMeta(agentSessionId: string): Promise<AgentBrowserSessionMeta>;
}

const createUnsupportedError = () => new Error("browser_session_unsupported");

export const unsupportedAgentBrowserHost: AgentBrowserHost = {
	async ensureSession() {
		throw createUnsupportedError();
	},
	async navigate() {
		throw createUnsupportedError();
	},
	async readPage() {
		throw createUnsupportedError();
	},
	async readElement() {
		throw createUnsupportedError();
	},
	async click() {
		throw createUnsupportedError();
	},
	async type() {
		throw createUnsupportedError();
	},
	async scroll() {
		throw createUnsupportedError();
	},
	async reveal() {
		throw createUnsupportedError();
	},
	async teardown() {},
	async getSessionMeta() {
		return { active: false, visible: false };
	},
};
