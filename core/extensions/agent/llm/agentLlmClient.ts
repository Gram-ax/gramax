import type { AgentLlmAdapter } from "./agentLlmAdapter";
import { AgentLlmAdapter as AgentLlmAdapterClass } from "./agentLlmAdapter";
import { AgentLlmChat } from "./agentLlmChat";
import { AgentLlmEventMapper } from "./agentLlmEventMapper";

export class AgentLlmClient {
	readonly adapter: AgentLlmAdapter;
	readonly mapper: AgentLlmEventMapper;
	readonly chat: AgentLlmChat;

	private constructor(adapter: AgentLlmAdapter, mapper: AgentLlmEventMapper, chat: AgentLlmChat) {
		this.adapter = adapter;
		this.mapper = mapper;
		this.chat = chat;
	}

	static create(apiUrl: string, apiKey: string): AgentLlmClient {
		return new AgentLlmClient(
			new AgentLlmAdapterClass(apiUrl, apiKey),
			new AgentLlmEventMapper(),
			new AgentLlmChat(),
		);
	}
}
