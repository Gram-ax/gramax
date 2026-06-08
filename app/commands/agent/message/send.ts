import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import { enqueueAgentUserMessage, lastAssistantReply } from "@ext/agent/core/session";
import { getAgentSession } from "@ext/agent/core/sessionStore";
import assert from "assert";
import { Command } from "../../../types/Command";

const messageSend: Command<{ ctx: Context; sessionId: string; text: string; openItemPath?: string | null }, unknown> =
	Command.create({
		path: "agent/message/send",

		kind: ResponseKind.json,

		async do({ ctx, sessionId, text, openItemPath }) {
			const session = getAgentSession(sessionId);
			assert(session, "agent/message/send: session_not_found");
			const trimmed = text.trim();
			assert(trimmed, "agent/message/send: empty_message");
			const signal = AbortSignal.timeout(600_000);
			await enqueueAgentUserMessage(sessionId, trimmed, this._app, ctx, this._commands, signal, openItemPath);

			const s = getAgentSession(sessionId);
			return {
				sessionId,
				reply: lastAssistantReply(s),
				events: s?.events ?? [],
				lastError: s?.lastError,
			};
		},

		params(ctx, _q, body) {
			const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
			const base = {
				ctx,
				sessionId: String(b.sessionId ?? ""),
				text: String(b.text ?? ""),
			};
			if (Object.hasOwn(b, "openItemPath")) {
				const p = b.openItemPath;
				return { ...base, openItemPath: p == null ? null : String(p) };
			}
			return base;
		},
	});

export default messageSend;
