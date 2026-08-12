class AgentBrowserConfig {
	provider = "";
	endpoint = "";
	maxResults = 10;
	timeoutMs = 30_000;

	configure(patch: Partial<AgentBrowserConfig>) {
		Object.assign(this, patch);
	}
}

export const agentBrowserConfig = new AgentBrowserConfig();
