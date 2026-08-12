export type ChatCompletionToolDefinition = {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
};

export type ChatCompletionToolCall = {
	id: string;
	type: "function";
	function: { name: string; arguments: string };
};

export type ChatCompletionMessage =
	| { role: "system"; content: string }
	| { role: "user"; content: string }
	| {
			role: "assistant";
			content: string | null;
			reasoning_content?: string | null;
			tool_calls?: ChatCompletionToolCall[];
	  }
	| { role: "tool"; tool_call_id: string; content: string };

export type ChatCompletionUsage = {
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
	prompt_cache_hit_tokens?: number;
	prompt_cache_miss_tokens?: number;
};

export type ChatIterationResult = {
	content: string | null;
	reasoning_content?: string | null;
	tool_calls?: ChatCompletionToolCall[];
	finish_reason: string | null;
};
