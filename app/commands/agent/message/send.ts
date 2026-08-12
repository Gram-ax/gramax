import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { AgentAttachmentInput } from "@ext/agent/core/attachmentStore";
import assert from "assert";
import { Command } from "../../../types/Command";

const messageSend: Command<
	{
		ctx: Context;
		sessionId: string;
		text: string;
		apiUrl: string;
		apiToken: string;
		attachments: AgentAttachmentInput[];
		openCatalogName?: string;
		openItemPath?: string;
		useSkill?: string;
	},
	unknown
> = Command.create({
	path: "agent/message/send",

	kind: ResponseKind.json,

	async do({ ctx, sessionId, text, apiUrl, apiToken, attachments, openCatalogName, openItemPath, useSkill }) {
		const session = this._app.agentManager.sessions.get(sessionId);
		assert(session, "agent/message/send: session_not_found");

		const trimmed = text.trim();
		assert(trimmed, "agent/message/send: empty_message");
		const llmClient = this._app.agentManager.getLlmClient(apiUrl, apiToken);

		const persistedAttachments =
			attachments.length > 0 ? await this._app.agentManager.attachments.put(sessionId, attachments) : [];
		try {
			await session.enqueueUserMessage(
				trimmed,
				persistedAttachments,
				llmClient,
				this._app,
				ctx,
				this._commands,
				openCatalogName,
				openItemPath,
				useSkill,
			);
		} finally {
			const meta = await this._app.agentManager.browserHost.getSessionMeta(sessionId);
			if (meta.active) {
				await this._app.agentManager.browserHost.teardown(sessionId);
				session.browser = { active: false, visible: false };
			}
		}

		await this._app.agentManager.sessions.clearDraft(sessionId).catch(() => {});

		const s = this._app.agentManager.sessions.get(sessionId);
		return {
			sessionId,
			reply: s?.lastAssistantReply() ?? "",
			events: s?.events ?? [],
			lastError: s?.lastError,
		};
	},

	params(ctx, _q, body) {
		const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
		return {
			ctx,
			sessionId: String(b.sessionId ?? ""),
			text: String(b.text ?? ""),
			apiUrl: String(b.apiUrl ?? ""),
			apiToken: String(b.apiToken ?? ""),
			attachments: Array.isArray(b.attachments) ? (b.attachments as AgentAttachmentInput[]) : [],
			openCatalogName: b.openCatalogName ? String(b.openCatalogName) : undefined,
			openItemPath: b.openItemPath ? String(b.openItemPath) : undefined,
			useSkill: b.useSkill ? String(b.useSkill) : undefined,
		};
	},
});

export default messageSend;
