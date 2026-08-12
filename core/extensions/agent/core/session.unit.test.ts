import { AgentErrorType } from "./agentError";
import type { AgentEvent } from "./events";
import { AgentSession } from "./session";

function createSession(events: AgentEvent[] = []): AgentSession {
	const session = new AgentSession("session-1", "");
	session.events = events;
	return session;
}

describe("AgentSession.updateUsage", () => {
	test("accumulates session tokens and tracks last prompt context usage", () => {
		const session = createSession();

		session.updateUsage(100, 150, 40, 60, 10_000);
		session.updateUsage(200, 250, 10, 20, 10_000);

		expect(session.usage).toMatchObject({
			totalUsage: 400,
			lastTurnUsage: 400,
			cacheHitTokens: 50,
			cacheMissTokens: 80,
			contextTokensUsed: 200,
			contextWindowTokens: 10_000,
			contextUsagePercent: 2,
		});
	});

	test("caps contextUsagePercent at 100", () => {
		const session = createSession();
		session.updateUsage(5000, 100, 0, 0, 1000);
		expect(session.usage.contextUsagePercent).toBe(100);
	});

	test("does not change contextUsagePercent without prompt tokens or window size", () => {
		const session = createSession();
		session.usage.contextUsagePercent = 42;

		session.updateUsage(0, 100, 0, 0, 10_000);
		expect(session.usage.contextUsagePercent).toBe(42);

		session.updateUsage(500, 100, 0, 0, 0);
		expect(session.usage.contextUsagePercent).toBe(42);
	});
});

describe("AgentSession.lastAssistantReply", () => {
	test("returns empty when there is no assistant_message", () => {
		expect(createSession().lastAssistantReply()).toBe("");
		expect(
			createSession([
				{ type: "user_message", turnId: "turn-1", ts: 1, content: "hi" },
				{ type: "assistant_delta", turnId: "turn-1", ts: 2, content: "streaming" },
			]).lastAssistantReply(),
		).toBe("");
	});

	test("returns last assistant_message, ignoring deltas and errors", () => {
		const session = createSession([
			{ type: "user_message", turnId: "turn-1", ts: 1, content: "hi" },
			{ type: "assistant_message", turnId: "turn-1", ts: 2, content: "first" },
			{ type: "assistant_delta", turnId: "turn-2", ts: 3, content: "partial" },
			{ type: "error", turnId: "turn-2", ts: 4, message: "fail", errorType: AgentErrorType.Unexpected },
			{ type: "assistant_message", turnId: "turn-2", ts: 5, content: "second" },
		]);

		expect(session.lastAssistantReply()).toBe("second");
	});
});
