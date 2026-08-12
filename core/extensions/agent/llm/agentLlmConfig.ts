export class AgentLlmConfig {
	directUrl = "https://api.deepseek.com/chat/completions";
	model = "deepseek-v4-pro";
	temperature = 0.5;
	contextWindowTokens = 1_000_000;
}

export const agentLlmConfig = new AgentLlmConfig();
