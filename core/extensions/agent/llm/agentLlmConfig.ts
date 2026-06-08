export type AgentLlmProvider = "openrouter" | "deepseek";

export class AgentLlmConfig {
	provider: AgentLlmProvider = "deepseek";
	providerUrl = "https://api.deepseek.com/chat/completions";
	model = "deepseek-v4-pro";
	temperature = 0.5;
	mockStream = false;
	mockTokenDelayMs = 80;
	contextWindowTokens = 1_000_000;
	maxSteps = 25;
	toolPreviewMaxChars = 8_000;

	private _apiKey: string | null = null;

	setApiKey(apiKey: string): void {
		const normalized = apiKey.trim();
		this._apiKey = normalized.length > 0 ? normalized : null;
	}

	clearApiKey(): void {
		this._apiKey = null;
	}

	getApiKey(): string | null {
		return this._apiKey;
	}
}

const configSingleton = new AgentLlmConfig();

export function getAgentLlmConfig(): AgentLlmConfig {
	return configSingleton;
}
