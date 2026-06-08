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

export type ChatCompletionToolCallDelta = {
	index?: number;
	id?: string;
	type?: string;
	function?: { name?: string; arguments?: string };
};

export type ChatCompletionToolCallAcc = { id: string; name: string; arguments: string };

export function mergeChatCompletionToolCallDeltas(
	accs: Map<number, ChatCompletionToolCallAcc>,
	deltas: ChatCompletionToolCallDelta[] | undefined,
): void {
	if (!deltas?.length) return;
	for (const p of deltas) {
		const idx = typeof p.index === "number" ? p.index : 0;
		let t = accs.get(idx);
		if (!t) {
			t = { id: "", name: "", arguments: "" };
			accs.set(idx, t);
		}
		if (p.id) t.id = p.id;
		if (p.function?.name) t.name += p.function.name;
		if (p.function?.arguments) t.arguments += p.function.arguments;
	}
}

export function chatCompletionToolCallAccsToCalls(
	accs: Map<number, ChatCompletionToolCallAcc>,
): ChatCompletionToolCall[] {
	const indices = [...accs.keys()].sort((a, b) => a - b);
	return indices.map((i) => {
		const t = accs.get(i)!;
		return {
			id: t.id,
			type: "function" as const,
			function: { name: t.name, arguments: t.arguments },
		};
	});
}

export type ChatCompletionSseParseOptions = {
	signal?: AbortSignal;
};

export async function* parseChatCompletionSseJsonLines(
	body: ReadableStream<Uint8Array>,
	options?: ChatCompletionSseParseOptions,
): AsyncGenerator<unknown, void, undefined> {
	const signal = options?.signal;
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	for (;;) {
		if (signal?.aborted) return;
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		for (;;) {
			const m = buffer.match(/\r?\n\r?\n/);
			if (!m || m.index === undefined) break;
			const rawBlock = buffer.slice(0, m.index);
			buffer = buffer.slice(m.index + m[0].length);
			const dataLine = rawBlock.split(/\r?\n/).find((l) => l.startsWith("data:"));
			if (!dataLine) continue;
			const payload = dataLine.slice(5).trim();
			if (payload === "[DONE]") return;
			try {
				yield JSON.parse(payload) as unknown;
			} catch {
				/* skip invalid JSON */
			}
		}
	}
}
