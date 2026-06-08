export type BeforeToolCallContext = {
	sessionId: string;
	toolName: string;
	args: unknown;
};

export type DiffMeta = {
	type: "markdown_edit" | string;
	beforeHash?: string;
	afterHash?: string;
	beforeSnippet?: string;
	afterSnippet?: string;
};

export type BeforeToolCallResult =
	| { decision: "allow" }
	| {
			decision: "pending_approval";
			correlationId: string;
			summary: string;
	  };

export type ToolCallPolicy = {
	beforeToolCall(ctx: BeforeToolCallContext): Promise<BeforeToolCallResult>;
};

export const allowAllPolicy: ToolCallPolicy = {
	async beforeToolCall() {
		return { decision: "allow" };
	},
};
