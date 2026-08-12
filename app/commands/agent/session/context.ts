import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { ChatCompletionMessage } from "@ext/agent/llm";
import assert from "assert";
import { Command } from "../../../types/Command";

const sessionContext: Command<{ ctx: Context; sessionId: string }, { messages: ChatCompletionMessage[] }> =
	Command.create({
		path: "agent/session/context",

		kind: ResponseKind.json,

		async do({ ctx, sessionId }) {
			const session = this._app.agentManager.sessions.get(sessionId);
			assert(session, "agent/session/context: session_not_found");

			const llmClient = this._app.agentManager.getLlmClient();
			const messages = await llmClient.mapper.eventsToMessages(
				this._app,
				ctx,
				this._commands,
				session.events,
				session.openCatalogName ?? undefined,
			);

			return { messages };
		},

		params(ctx, q) {
			return { ctx, sessionId: String(q.sessionId ?? "") };
		},
	});

export default sessionContext;
