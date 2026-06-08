import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import { AgentLlmToolSession, getAgentLlmConfig, mapAgentEventsToChatCompletionMessages } from "../llm";
import type { AgentEvent } from "./events";
import { runAgentTurn } from "./loop";
import { allowAllPolicy } from "./policy";
import { type AgentSession, addSessionUsage, getAgentSession } from "./sessionStore";

function linkAbortSignal(parent: AbortSignal | undefined, child: AbortController): () => void {
	if (!parent) return () => {};
	if (parent.aborted) {
		child.abort(parent.reason);
		return () => {};
	}
	const onAbort = () => child.abort(parent.reason);
	parent.addEventListener("abort", onAbort, { once: true });
	return () => parent.removeEventListener("abort", onAbort);
}

function handleAgentEvent(session: AgentSession, e: AgentEvent) {
	session.events.push(e);
	switch (e.type) {
		case "assistant_message":
			session.lastError = null;
			break;
		case "error":
			session.lastError = e.message;
			break;
		default:
			break;
	}
}

async function runOneTurn(
	session: AgentSession,
	userContent: string,
	app: Application,
	ctx: Context,
	commands: CommandTree,
	parentSignal?: AbortSignal,
): Promise<void> {
	session.processing = true;
	session.lastError = null;
	session.usage.lastTurnUsage = 0;
	const contextWindowTokens = getAgentLlmConfig().contextWindowTokens;
	const mcp = new AgentLlmToolSession(app, ctx, commands, session.id);
	const messages = mapAgentEventsToChatCompletionMessages(session.events);
	const runAbort = new AbortController();
	const unlinkAbort = linkAbortSignal(parentSignal, runAbort);
	session.activeRunController = runAbort;

	try {
		await runAgentTurn({
			sessionId: session.id,
			userContent,
			openItemPath: session.openItemPath,
			commands,
			ctx,
			messages,
			mcp,
			policy: allowAllPolicy,
			callbacks: {
				onEvent: (e) => handleAgentEvent(session, e),
			},
			onLlmUsage: (usage) => {
				addSessionUsage(session, usage.prompt_tokens, usage.total_tokens, contextWindowTokens);
			},
			signal: runAbort.signal,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		if (!runAbort.signal.aborted) {
			session.lastError = message;
			const ev: AgentEvent = { type: "error", ts: Date.now(), message };
			session.events.push(ev);
		}
	} finally {
		// console.log("[agent] usage", {
		// 	sessionId: session.id,
		// 	usage: session.usage,
		// });
		unlinkAbort();
		if (session.activeRunController === runAbort) {
			session.activeRunController = null;
		}
		session.processing = false;
	}
}

export function enqueueAgentUserMessage(
	sessionId: string,
	userText: string,
	app: Application,
	ctx: Context,
	commands: CommandTree,
	signal?: AbortSignal,
	openItemPath?: string | null,
): Promise<void> {
	const session = getAgentSession(sessionId);
	if (!session) {
		return Promise.resolve();
	}

	const content = userText.trim();
	if (openItemPath !== undefined) {
		session.openItemPath = openItemPath;
	}
	session.events.push({ type: "user_message", ts: Date.now(), content });

	const parentSignal = signal ?? AbortSignal.timeout(600_000);
	session.runChain = session.runChain.then(() => runOneTurn(session, content, app, ctx, commands, parentSignal));
	return session.runChain;
}

export function lastAssistantReply(session: AgentSession | undefined): string {
	if (!session?.events.length) return "";
	for (let i = session.events.length - 1; i >= 0; i--) {
		const e = session.events[i];
		if (e.type === "assistant_message") return e.content;
	}
	return "";
}
