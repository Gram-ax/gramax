export type AgentToolCallContext = {
	sessionId: string;
	toolName: string;
	args: unknown;
};

export type AgentToolCallDecision =
	| { decision: "allow" }
	| {
			decision: "pending_approval";
			correlationId: string;
			summary: string;
	  };

export type AgentToolCallPolicy = {
	beforeToolCall(ctx: AgentToolCallContext): Promise<AgentToolCallDecision>;
};

export const allowAllAgentToolCallPolicy: AgentToolCallPolicy = {
	async beforeToolCall() {
		return { decision: "allow" };
	},
};
