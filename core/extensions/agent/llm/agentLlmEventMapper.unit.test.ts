import Path from "@core/FileProvider/Path/Path";
import { AgentErrorType } from "../core/agentError";
import type { AgentEvent } from "../core/events";
import { getSystemPrompt, getUserMessage } from "../prompts";
import { AGENT_PROMPT_MAP } from "../prompts/agentPromptMap";
import { AgentLlmEventMapper } from "./agentLlmEventMapper";

const defaultApp = {
	wm: {
		current: () => ({
			getCatalog: async () => null,
		}),
	},
} as never;

const defaultCtx = {} as never;
const defaultCommands = {} as never;
const mapper = new AgentLlmEventMapper();

async function mapEvents(events: AgentEvent[], catalogName?: string) {
	return mapper.eventsToMessages(defaultApp, defaultCtx, defaultCommands, events, catalogName);
}

describe("mapAgentEventsToChatCompletionMessages", () => {
	test("prepends system message and keeps completed tool call pairs", async () => {
		const events: AgentEvent[] = [
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "find docs" },
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 2,
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: { query: "docs" },
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 3,
				toolCallId: "call-1",
				name: "search_catalogs",
				content: '{"hits":[]}',
				contentPreview: '{"hits":[]}',
				fullLength: 11,
				isError: false,
			},
			{ type: "turn_finished", turnId: "turn-1", ts: 4, status: "completed" },
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
			{ role: "user", content: "find docs" },
			{
				role: "assistant",
				content: null,
				tool_calls: [
					{
						id: "call-1",
						type: "function",
						function: {
							name: "search_catalogs",
							arguments: '{"query":"docs"}',
						},
					},
				],
			},
			{ role: "tool", tool_call_id: "call-1", content: '{"hits":[]}' },
		]);
	});

	test("adds browser preamble to system prompt only for browser-allowed turn", async () => {
		const events: AgentEvent[] = [
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "find docs", browserAllowed: true },
		];

		expect(await mapEvents(events)).toEqual([
			{
				role: "system",
				content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands, undefined, undefined, true),
			},
			{ role: "user", content: "find docs" },
		]);
	});

	test("keeps user message from failed turns but skips incomplete tool calls", async () => {
		const events: AgentEvent[] = [
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "create a section" },
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 2,
				toolCallId: "call-1",
				name: "create_catalog_item",
				arguments: { type: "category", title: "drafts" },
			},
			{ type: "error", turnId: "turn-1", ts: 3, message: "aborted", errorType: AgentErrorType.Unexpected },
			{
				type: "turn_finished",
				turnId: "turn-1",
				ts: 4,
				status: "failed",
			},
			{ type: "user_message", turnId: "turn-2", ts: 5, content: "continue" },
			{ type: "assistant_message", turnId: "turn-2", ts: 6, content: "ok" },
			{ type: "turn_finished", turnId: "turn-2", ts: 7, status: "completed" },
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
			{ role: "user", content: "create a section" },
			{ role: "user", content: "continue" },
			{ role: "assistant", content: "ok" },
		]);
	});

	test("keeps user message and partial assistant text from cancelled turns", async () => {
		const events: AgentEvent[] = [
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "Создай раздел Drafts" },
			{ type: "assistant_delta", turnId: "turn-1", ts: 2, content: "План:\n1) " },
			{ type: "assistant_delta", turnId: "turn-1", ts: 3, content: "найду каталог" },
			{ type: "turn_finished", turnId: "turn-1", ts: 4, status: "cancelled" },
			{ type: "user_message", turnId: "turn-2", ts: 5, content: "Нет, раздел Archive" },
			{ type: "turn_finished", turnId: "turn-2", ts: 6, status: "completed" },
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
			{ role: "user", content: "Создай раздел Drafts" },
			{ role: "assistant", content: "План:\n1) найду каталог" },
			{ role: "user", content: "Нет, раздел Archive" },
		]);
	});

	test("does not duplicate streamed assistant text when tool call follows delta", async () => {
		const events: AgentEvent[] = [
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "find docs" },
			{ type: "assistant_delta", turnId: "turn-1", ts: 2, content: "План: ищу" },
			{ type: "assistant_message", turnId: "turn-1", ts: 3, content: "План: ищу" },
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 4,
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: { query: "docs" },
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 4,
				toolCallId: "call-1",
				name: "search_catalogs",
				content: '{"hits":[]}',
				contentPreview: '{"hits":[]}',
				fullLength: 11,
				isError: false,
			},
			{ type: "assistant_message", turnId: "turn-1", ts: 5, content: "Нашёл документы" },
			{ type: "turn_finished", turnId: "turn-1", ts: 6, status: "completed" },
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
			{ role: "user", content: "find docs" },
			{
				role: "assistant",
				content: "План: ищу",
				tool_calls: [
					{
						id: "call-1",
						type: "function",
						function: {
							name: "search_catalogs",
							arguments: '{"query":"docs"}',
						},
					},
				],
			},
			{ role: "tool", tool_call_id: "call-1", content: '{"hits":[]}' },
			{ role: "assistant", content: "Нашёл документы" },
		]);
	});

	test("maps tool call and result to assistant with tool_calls and tool message", async () => {
		const events: AgentEvent[] = [
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 1,
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: { query: "docs" },
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 2,
				toolCallId: "call-1",
				name: "search_catalogs",
				content: '{"hits":[]}',
				contentPreview: '{"hits":[]}',
				fullLength: 11,
				isError: false,
			},
			{ type: "turn_finished", turnId: "turn-1", ts: 3, status: "completed" },
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
			{
				role: "assistant",
				content: null,
				tool_calls: [
					{
						id: "call-1",
						type: "function",
						function: {
							name: "search_catalogs",
							arguments: '{"query":"docs"}',
						},
					},
				],
			},
			{ role: "tool", tool_call_id: "call-1", content: '{"hits":[]}' },
		]);
	});

	test("skips orphan tool_result without matching tool call", async () => {
		const events: AgentEvent[] = [
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 1,
				toolCallId: "call-orphan",
				name: "search_catalogs",
				contentPreview: "preview",
				fullLength: 7,
				isError: false,
			},
			{ type: "turn_finished", turnId: "turn-1", ts: 2, status: "completed" },
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
		]);
	});

	test("merges assistant_message with tool calls into one assistant message", async () => {
		const events: AgentEvent[] = [
			{
				type: "assistant_message",
				turnId: "turn-1",
				ts: 1,
				content: "",
				reasoningContent: "tool-thoughts",
			},
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 2,
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: {},
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 3,
				toolCallId: "call-1",
				name: "search_catalogs",
				contentPreview: "ok-1",
				fullLength: 4,
				isError: false,
			},
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 4,
				toolCallId: "call-2",
				name: "read_catalog_item",
				arguments: {},
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 5,
				toolCallId: "call-2",
				name: "read_catalog_item",
				contentPreview: "ok-2",
				fullLength: 4,
				isError: false,
			},
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
			{
				role: "assistant",
				content: null,
				reasoning_content: "tool-thoughts",
				tool_calls: [
					{
						id: "call-1",
						type: "function",
						function: { name: "search_catalogs", arguments: "{}" },
					},
					{
						id: "call-2",
						type: "function",
						function: { name: "read_catalog_item", arguments: "{}" },
					},
				],
			},
			{ role: "tool", tool_call_id: "call-1", content: "ok-1" },
			{ role: "tool", tool_call_id: "call-2", content: "ok-2" },
		]);
	});

	test("includes reasoning_content on assistant_message and tool_call", async () => {
		const events: AgentEvent[] = [
			{
				type: "assistant_message",
				turnId: "turn-1",
				ts: 1,
				content: "searching",
				reasoningContent: "tool-thoughts",
			},
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 2,
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: {},
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 3,
				toolCallId: "call-1",
				name: "search_catalogs",
				contentPreview: "ok",
				fullLength: 2,
				isError: false,
			},
			{
				type: "assistant_message",
				turnId: "turn-1",
				ts: 4,
				content: "answer",
				reasoningContent: "final-thoughts",
			},
		];

		expect(await mapEvents(events)).toEqual([
			{ role: "system", content: await getSystemPrompt(defaultApp, defaultCtx, defaultCommands) },
			{
				role: "assistant",
				content: "searching",
				reasoning_content: "tool-thoughts",
				tool_calls: [
					{
						id: "call-1",
						type: "function",
						function: { name: "search_catalogs", arguments: "{}" },
					},
				],
			},
			{ role: "tool", tool_call_id: "call-1", content: "ok" },
			{ role: "assistant", content: "answer", reasoning_content: "final-thoughts" },
		]);
	});

	test("enriches user message with open context, attachments, and skill", async () => {
		const skill = { name: "test-skill", description: "Описание навыка", content: "Тело навыка для агента" };
		const app = {
			wm: {
				current: () => ({
					getCatalog: async () => ({
						name: "docs",
						findItemByItemPath: () => ({
							ref: { path: new Path("docs/section/a.md") },
							logicPath: "docs/section/a",
							getTitle: () => "Title",
						}),
						getRepositoryRelativePath: () => new Path("section/a.md"),
						getPathname: async () => "source/-/repo/branch/docs/section/a.md",
						customProviders: {
							agentResourcesProvider: {
								getSkills: async () => [skill],
								getSkillByName: async (_app, _ctx, _commands, name: string) =>
									name === skill.name ? skill : null,
								getSystemPrompt: async () => null,
							},
						},
					}),
				}),
			},
		} as never;

		const userEvent: Extract<AgentEvent, { type: "user_message" }> = {
			type: "user_message",
			turnId: "turn-1",
			ts: 1,
			content: "Проверь файл",
			openCatalogName: "docs",
			openItemPath: "section/a.md",
			useSkill: skill.name,
			attachments: [
				{
					originalFilename: "notes.txt",
					itemPath: "sessions/sess-1/attachments/notes.txt",
					size: 18,
					mime: "text/plain",
				},
			],
		};
		const events: AgentEvent[] = [
			userEvent,
			{ type: "turn_finished", turnId: "turn-1", ts: 2, status: "completed" },
		];

		const enriched = await getUserMessage(app, defaultCtx, defaultCommands, userEvent);

		expect(await mapper.eventsToMessages(app, defaultCtx, defaultCommands, events)).toEqual([
			{ role: "system", content: await getSystemPrompt(app, defaultCtx, defaultCommands) },
			{ role: "user", content: enriched },
		]);
		expect(enriched).toContain(AGENT_PROMPT_MAP.openItemPreamble);
		expect(enriched).toContain(userEvent.openCatalogName);
		expect(enriched).toContain(userEvent.openItemPath);
		expect(enriched).toContain(AGENT_PROMPT_MAP.attachmentsPreamble);
		expect(enriched).toContain("notes.txt");
		expect(enriched).toContain(AGENT_PROMPT_MAP.forcedSkillPreamble);
		expect(enriched).toContain(skill.content);
		expect(enriched).toContain(userEvent.content);
	});
});

describe("toolsToLlmFormat", () => {
	test("maps ToolDefinition list to chat completion tools", () => {
		expect(
			mapper.toolsToLlmFormat([
				{
					name: "search_catalogs",
					description: "Search in catalogs",
					inputSchema: {
						type: "object",
						properties: { query: { type: "string" } },
						required: ["query"],
						additionalProperties: false,
					},
					execute: jest.fn(),
				},
			]),
		).toEqual([
			{
				type: "function",
				function: {
					name: "search_catalogs",
					description: "Search in catalogs",
					parameters: {
						type: "object",
						properties: { query: { type: "string" } },
						required: ["query"],
						additionalProperties: false,
					},
				},
			},
		]);
	});
});

describe("mapChatCompletionMessagesToAgentEvents", () => {
	test("maps user and assistant messages", () => {
		expect(
			mapper.messagesToEvents("turn-1", [
				{ role: "user", content: "find docs" },
				{ role: "assistant", content: "hello", reasoning_content: "thoughts" },
			]),
		).toEqual([
			{ type: "user_message", turnId: "turn-1", ts: expect.any(Number), content: "find docs" },
			{
				type: "assistant_message",
				turnId: "turn-1",
				ts: expect.any(Number),
				content: "hello",
				reasoningContent: "thoughts",
			},
		]);
	});

	test("skips assistant messages without text or reasoning", () => {
		expect(mapper.messagesToEvents("turn-1", [{ role: "assistant", content: "" }])).toEqual([]);
	});

	test("maps assistant with tool_calls and following tool messages", () => {
		expect(
			mapper.messagesToEvents("turn-1", [
				{
					role: "assistant",
					content: "searching",
					reasoning_content: "tool-thoughts",
					tool_calls: [
						{
							id: "call-1",
							type: "function",
							function: { name: "search_catalogs", arguments: '{"query":"docs"}' },
						},
					],
				},
				{ role: "tool", tool_call_id: "call-1", content: '{"hits":[]}' },
			]),
		).toEqual([
			{
				type: "assistant_message",
				turnId: "turn-1",
				ts: expect.any(Number),
				content: "searching",
				reasoningContent: "tool-thoughts",
			},
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: { query: "docs" },
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-1",
				name: "search_catalogs",
				content: '{"hits":[]}',
				contentPreview: '{"hits":[]}',
				fullLength: 11,
				isError: false,
			},
		]);
	});

	test("maps tool step without assistant text", () => {
		expect(
			mapper.messagesToEvents("turn-1", [
				{
					role: "assistant",
					content: null,
					tool_calls: [
						{
							id: "call-1",
							type: "function",
							function: { name: "search_catalogs", arguments: '{"query":"docs"}' },
						},
					],
				},
				{ role: "tool", tool_call_id: "call-1", content: '{"hits":[]}' },
			]),
		).toEqual([
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: { query: "docs" },
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-1",
				name: "search_catalogs",
				content: '{"hits":[]}',
				contentPreview: '{"hits":[]}',
				fullLength: 11,
				isError: false,
			},
		]);
	});

	test("maps batch tool calls", () => {
		expect(
			mapper.messagesToEvents("turn-1", [
				{
					role: "assistant",
					content: null,
					reasoning_content: "tool-thoughts",
					tool_calls: [
						{ id: "call-1", type: "function", function: { name: "search_catalogs", arguments: "{}" } },
						{ id: "call-2", type: "function", function: { name: "read_catalog_item", arguments: "{}" } },
					],
				},
				{ role: "tool", tool_call_id: "call-1", content: "ok-1" },
				{ role: "tool", tool_call_id: "call-2", content: "ok-2" },
			]),
		).toEqual([
			{
				type: "assistant_message",
				turnId: "turn-1",
				ts: expect.any(Number),
				content: "",
				reasoningContent: "tool-thoughts",
			},
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: {},
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-1",
				name: "search_catalogs",
				content: "ok-1",
				contentPreview: "ok-1",
				fullLength: 4,
				isError: false,
			},
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-2",
				name: "read_catalog_item",
				arguments: {},
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: expect.any(Number),
				toolCallId: "call-2",
				name: "read_catalog_item",
				content: "ok-2",
				contentPreview: "ok-2",
				fullLength: 4,
				isError: false,
			},
		]);
	});

	test("skips system messages", () => {
		expect(
			mapper.messagesToEvents("turn-1", [
				{ role: "system", content: "system prompt" },
				{ role: "user", content: "hi" },
			]),
		).toEqual([{ type: "user_message", turnId: "turn-1", ts: expect.any(Number), content: "hi" }]);
	});
});

function stripEventTimestamps(events: AgentEvent[]): AgentEvent[] {
	return events.map(({ ts: _ts, ...event }) => event as AgentEvent);
}

describe("mapChatCompletionMessagesToAgentEvents round-trip", () => {
	test("round-trips completed tool call pairs", async () => {
		const events: AgentEvent[] = [
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "find docs" },
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 2,
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: { query: "docs" },
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 3,
				toolCallId: "call-1",
				name: "search_catalogs",
				content: '{"hits":[]}',
				contentPreview: '{"hits":[]}',
				fullLength: 11,
				isError: false,
			},
		];

		const messages = await mapEvents(events);
		const back = mapper.messagesToEvents(
			"turn-1",
			messages.filter((m) => m.role !== "system"),
			0,
		);

		expect(stripEventTimestamps(back)).toEqual(stripEventTimestamps(events));
	});

	test("round-trips assistant_message with tool calls and final answer", async () => {
		const events: AgentEvent[] = [
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "find docs" },
			{ type: "assistant_message", turnId: "turn-1", ts: 3, content: "План: ищу" },
			{
				type: "tool_call_requested",
				turnId: "turn-1",
				ts: 4,
				toolCallId: "call-1",
				name: "search_catalogs",
				arguments: { query: "docs" },
			},
			{
				type: "tool_result",
				turnId: "turn-1",
				ts: 4,
				toolCallId: "call-1",
				name: "search_catalogs",
				content: '{"hits":[]}',
				contentPreview: '{"hits":[]}',
				fullLength: 11,
				isError: false,
			},
			{ type: "assistant_message", turnId: "turn-1", ts: 5, content: "Нашёл документы" },
		];

		const messages = await mapEvents(events);
		const back = mapper.messagesToEvents(
			"turn-1",
			messages.filter((m) => m.role !== "system"),
			0,
		);

		expect(stripEventTimestamps(back)).toEqual(stripEventTimestamps(events));
	});
});
