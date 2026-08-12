/**
 * @jest-environment node
 */
import type { ChatMessage } from "../types/chat";
import { partitionSectionMessages } from "./partitionSectionMessages";

let seq = 0;
const nextId = () => `m${seq++}`;

const assistant = (opts: { isLoading?: boolean } = {}): ChatMessage => ({
	id: nextId(),
	kind: "assistant",
	description: "exp",
	...opts,
});

const toolCall = (): ChatMessage => ({
	id: nextId(),
	kind: "tool_call",
	toolName: "read",
	toolCallId: nextId(),
	toolArguments: {},
});

const toolResult = (): ChatMessage => ({
	id: nextId(),
	kind: "tool_result",
	toolName: "read",
	toolCallId: nextId(),
	toolResultIsError: false,
	toolResultTs: 0,
	toolResultContentPreview: "",
	toolResultFullLength: 0,
});

const ids = (messages: ChatMessage[]) => messages.map((m) => m.id);

describe("partitionSectionMessages", () => {
	test("no thinking block → empty partition regardless of other inputs", () => {
		const result = partitionSectionMessages([assistant(), toolCall()], true, false);
		expect(result).toEqual({
			insideMessages: [],
			belowAssistant: null,
			belowAssistantIsGray: false,
			belowToolMessages: [],
		});
	});

	describe("finished turn", () => {
		test("no assistant in afterFirst → everything stays inside the collapse", () => {
			const tc = toolCall();
			const tr = toolResult();
			const result = partitionSectionMessages([tc, tr], true, true);
			expect(ids(result.insideMessages)).toEqual(ids([tc, tr]));
			expect(result.belowAssistant).toBeNull();
			expect(result.belowToolMessages).toEqual([]);
		});

		test("last assistant is surfaced below (not gray), the rest collapses", () => {
			const a1 = assistant();
			const tc = toolCall();
			const a2 = assistant();
			const result = partitionSectionMessages([a1, tc, a2], true, true);
			expect(result.belowAssistant).toBe(a2);
			expect(result.belowAssistantIsGray).toBe(false);
			expect(ids(result.insideMessages)).toEqual(ids([a1, tc]));
			expect(result.belowToolMessages).toEqual([]);
		});
	});

	describe("in-progress turn — assistant present after first", () => {
		test("active tool_call after the assistant → explanation gray below + tool bundle below", () => {
			const a1 = assistant();
			const a2 = assistant();
			const tc = toolCall();
			const tr1 = toolResult();
			const tr2 = toolResult();
			const result = partitionSectionMessages([a1, a2, tc, tr1, tr2], false, true);

			expect(result.belowAssistant).toBe(a2);
			expect(result.belowAssistantIsGray).toBe(true);
			expect(ids(result.belowToolMessages)).toEqual(ids([tc, tr1, tr2]));
			// before the last assistant + between it and the tool_call
			expect(ids(result.insideMessages)).toEqual(ids([a1]));
		});

		test("tool_result bundle stops at the first non-tool_result message", () => {
			const a = assistant();
			const tc = toolCall();
			const tr = toolResult();
			const trailingCall = toolCall();
			const result = partitionSectionMessages([a, tc, tr, trailingCall], false, true);

			// the latest tool_call wins, so trailingCall becomes the bundle start with no results
			expect(ids(result.belowToolMessages)).toEqual(ids([trailingCall]));
			expect(result.belowAssistant).toBe(a);
			expect(ids(result.insideMessages)).toEqual(ids([tc, tr]));
		});

		test("no tool_call after a loading assistant → explanation below and gray", () => {
			const a = assistant({ isLoading: true });
			const result = partitionSectionMessages([a], false, true);
			expect(result.belowAssistant).toBe(a);
			expect(result.belowAssistantIsGray).toBe(true);
			expect(result.belowToolMessages).toEqual([]);
			expect(result.insideMessages).toEqual([]);
		});

		test("no tool_call after a completed assistant → explanation below, not gray", () => {
			const before = assistant();
			const a = assistant({ isLoading: false });
			const result = partitionSectionMessages([before, a], false, true);
			expect(result.belowAssistant).toBe(a);
			expect(result.belowAssistantIsGray).toBe(false);
			expect(ids(result.insideMessages)).toEqual(ids([before]));
		});
	});

	describe("in-progress turn — no assistant after first", () => {
		test("tool_call present → tool bundle below, the rest collapses", () => {
			const tcOld = toolCall();
			const tc = toolCall();
			const tr = toolResult();
			const result = partitionSectionMessages([tcOld, tc, tr], false, true);
			expect(result.belowAssistant).toBeNull();
			expect(ids(result.belowToolMessages)).toEqual(ids([tc, tr]));
			expect(ids(result.insideMessages)).toEqual(ids([tcOld]));
		});

		test("no tool_call → everything stays inside the collapse", () => {
			const tr = toolResult();
			const result = partitionSectionMessages([tr], false, true);
			expect(result.belowAssistant).toBeNull();
			expect(result.belowToolMessages).toEqual([]);
			expect(ids(result.insideMessages)).toEqual(ids([tr]));
		});
	});
});
