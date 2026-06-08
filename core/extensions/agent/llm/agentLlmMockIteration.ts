import type {
	ChatCompletionMessage,
	ChatCompletionToolCall,
	ChatCompletionToolDefinition,
} from "./agentLlmChatCompletions";
import { getAgentLlmConfig } from "./agentLlmConfig";

type PlannedToolCall = {
	name: string;
	args: Record<string, unknown>;
};

const TARGET_CATALOG = "new-catalog";
const CATEGORY_NAME = "mock-agent-category";

function abortError(): Error {
	return new DOMException("The operation was aborted.", "AbortError");
}

async function waitWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
	if (!ms) return;
	if (signal?.aborted) throw abortError();
	await new Promise<void>((resolve, reject) => {
		const timer = setTimeout(() => {
			cleanup();
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			cleanup();
			reject(abortError());
		};
		const cleanup = () => {
			if (signal) signal.removeEventListener("abort", onAbort);
		};
		if (signal) signal.addEventListener("abort", onAbort);
	});
}

function splitForStreaming(text: string): string[] {
	if (!text) return [];
	const chunks: string[] = [];
	let cursor = 0;
	while (cursor < text.length) {
		const span = 6 + (cursor % 11);
		chunks.push(text.slice(cursor, cursor + span));
		cursor += span;
	}
	return chunks;
}

function extractLastUserText(messages: ChatCompletionMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i];
		if (m.role === "user") return m.content.trim();
	}
	return "";
}

function countToolResultsAfterLastUser(messages: ChatCompletionMessage[]): number {
	let lastUserIdx = -1;
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i]?.role === "user") {
			lastUserIdx = i;
			break;
		}
	}
	if (lastUserIdx < 0) return 0;
	let count = 0;
	for (let i = lastUserIdx + 1; i < messages.length; i++) {
		if (messages[i]?.role === "tool") count += 1;
	}
	return count;
}

function buildFirstParagraph(userText: string): string {
	return [
		"### Ответ (mock stream)",
		"",
		"Запускаю полный тестовый сценарий инструментов: каталоги, навигация, создание, обновление, чтение, поиск и удаление.",
		"",
		`**Запрос:** ${userText || "без текста"}`,
	].join("\n");
}

function buildSecondParagraph(): string {
	return [
		"Сценарий завершен: все запланированные вызовы инструментов выполнены последовательно.",
		"",
		"Могу повторить прогон или переключить mock на другой тестовый сценарий.",
	].join("\n");
}

function buildPlannedCalls(userText: string, tools: ChatCompletionToolDefinition[]): PlannedToolCall[] {
	const available = new Set(tools.map((t) => t.function.name));
	const requestedQuery = userText || "проверка mock-поиска";
	const desired: PlannedToolCall[] = [
		{ name: "list_catalogs", args: {} },
		{ name: "get_navigation", args: { catalogName: TARGET_CATALOG } },
		{
			name: "create_catalog_item",
			args: {
				catalogName: TARGET_CATALOG,
				type: "category",
				name: CATEGORY_NAME,
				content: "# Mock Agent Category\n\nКатегория создана в mock-сценарии.",
			},
		},
		{
			name: "search_catalogs",
			args: {
				query: requestedQuery,
			},
		},
	];

	return desired.filter((step) => available.has(step.name));
}

async function streamText(
	text: string,
	delayMs: number,
	onContentDelta: (piece: string) => void,
	signal?: AbortSignal,
) {
	for (const chunk of splitForStreaming(text)) {
		await waitWithAbort(delayMs, signal);
		onContentDelta(chunk);
	}
}

export async function streamAgentLlmMockIteration(
	messages: ChatCompletionMessage[],
	tools: ChatCompletionToolDefinition[] | undefined,
	onContentDelta: (piece: string) => void,
	signal?: AbortSignal,
): Promise<{
	content: string | null;
	tool_calls?: ChatCompletionToolCall[];
	finish_reason: string | null;
}> {
	const userText = extractLastUserText(messages);
	const delayMs = getAgentLlmConfig().mockTokenDelayMs;
	const plannedCalls = buildPlannedCalls(userText, tools ?? []);
	const completedCalls = countToolResultsAfterLastUser(messages);

	if (plannedCalls.length > 0 && completedCalls < plannedCalls.length) {
		const next = plannedCalls[completedCalls]!;
		let assistantContent: string | null = null;
		if (completedCalls === 0) {
			assistantContent = buildFirstParagraph(userText);
			await streamText(assistantContent, delayMs, onContentDelta, signal);
		}

		return {
			content: assistantContent,
			tool_calls: [
				{
					id: `mock-tool-${Date.now()}-${completedCalls}`,
					type: "function",
					function: {
						name: next.name,
						arguments: JSON.stringify(next.args),
					},
				},
			],
			finish_reason: "tool_calls",
		};
	}

	const finalAnswer = plannedCalls.length
		? buildSecondParagraph()
		: "Mock-сценарий не запущен: в модели не обнаружены необходимые инструменты.";
	await streamText(finalAnswer, delayMs, onContentDelta, signal);

	return {
		content: finalAnswer,
		finish_reason: "stop",
	};
}
