import type { ChatMessage } from "../types/chat";

export type PartitionResult = {
	insideMessages: ChatMessage[];
	belowAssistant: ChatMessage | null;
	belowAssistantIsGray: boolean;
	belowToolMessages: ChatMessage[];
};

const empty = (): PartitionResult => ({
	insideMessages: [],
	belowAssistant: null,
	belowAssistantIsGray: false,
	belowToolMessages: [],
});

const lastIndexOf = (messages: ChatMessage[], kind: ChatMessage["kind"], after = -1): number => {
	for (let i = messages.length - 1; i > after; i--) if (messages[i].kind === kind) return i;
	return -1;
};

const bundleEnd = (messages: ChatMessage[], toolCallIdx: number): number => {
	let end = toolCallIdx + 1;
	while (end < messages.length && messages[end].kind === "tool_result") end++;
	return end;
};

export const partitionSectionMessages = (
	afterFirst: ChatMessage[],
	isFinished: boolean,
	hasThinkingBlock: boolean,
): PartitionResult => {
	if (!hasThinkingBlock) return empty();

	const lastExpIdx = lastIndexOf(afterFirst, "assistant");
	const lastExp = lastExpIdx === -1 ? null : afterFirst[lastExpIdx];

	if (isFinished) {
		if (!lastExp) return { ...empty(), insideMessages: afterFirst };
		return { ...empty(), insideMessages: afterFirst.filter((_, i) => i !== lastExpIdx), belowAssistant: lastExp };
	}

	const lastToolCallIdx = lastIndexOf(afterFirst, "tool_call", lastExpIdx);
	if (lastToolCallIdx !== -1) {
		return {
			insideMessages: afterFirst.slice(0, lastToolCallIdx).filter((_, i) => i !== lastExpIdx),
			belowAssistant: lastExp,
			belowAssistantIsGray: lastExp !== null,
			belowToolMessages: afterFirst.slice(lastToolCallIdx, bundleEnd(afterFirst, lastToolCallIdx)),
		};
	}

	if (!lastExp) return { ...empty(), insideMessages: afterFirst };
	return {
		...empty(),
		insideMessages: afterFirst.slice(0, lastExpIdx),
		belowAssistant: lastExp,
		belowAssistantIsGray: lastExp.kind === "assistant" && lastExp.isLoading === true,
	};
};
