export function buildSseBody(events: object[]): string {
	return `${events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("")}data: [DONE]\n\n`;
}

export function buildSseToolCall(name: string, args: Record<string, unknown>, callId: string): object {
	return {
		choices: [
			{
				delta: {
					tool_calls: [
						{
							index: 0,
							id: callId,
							type: "function",
							function: { name, arguments: JSON.stringify(args) },
						},
					],
				},
				finish_reason: "tool_calls",
			},
		],
	};
}

export function buildSseStop(content: string): object {
	return {
		choices: [
			{
				delta: { content },
				finish_reason: "stop",
			},
		],
	};
}
