import type { AgentDraftSnapshot } from "../components/types/chat";
import { agentConfig } from "./agentConfig";
import type { AgentFileStore } from "./agentFileStore";
import { AgentSession } from "./session";

export class AgentSessionStore {
	private readonly _sessions = new Map<string, AgentSession>();

	constructor(private readonly _fileStore: AgentFileStore) {}

	private _getSessionFilePath(id: string): string {
		return `sessions/${id}/session.json`;
	}

	private _getDraftFilePath(id: string): string {
		return `sessions/${id}/draft.json`;
	}

	private _getLastActivityTs(session: Pick<AgentSession, "events">): number {
		let maxTs = Number.NEGATIVE_INFINITY;
		for (const event of session.events) {
			if (typeof event.ts === "number" && Number.isFinite(event.ts)) {
				maxTs = Math.max(maxTs, event.ts);
			}
		}
		return maxTs;
	}

	private async _applySessionsLimit(activeSessionId?: string | null): Promise<void> {
		const limit = agentConfig.maxStoredSessions;
		const all = Array.from(this._sessions.values());
		if (limit == null || limit <= 0 || all.length <= limit) return;

		const keepIds = new Set(
			[...all]
				.sort((a, b) => this._getLastActivityTs(a) - this._getLastActivityTs(b))
				.slice(-limit)
				.map((session) => session.id),
		);

		if (activeSessionId && this._sessions.has(activeSessionId)) {
			keepIds.add(activeSessionId);
		}

		for (const session of all) {
			if (keepIds.has(session.id)) continue;
			await this.delete(session.id);
		}
	}

	private async _save(id: string): Promise<void> {
		const session = this._sessions.get(id);
		if (!session) return;
		await this._fileStore.writeJsonFile(this._getSessionFilePath(id), session.toSnapshot());
	}

	async saveDraft(id: string, draft: AgentDraftSnapshot): Promise<void> {
		const empty = !draft.text.trim() && !draft.selectedSkillName && !draft.attachments?.length;
		if (empty) {
			await this._fileStore.deletePath(this._getDraftFilePath(id));
			return;
		}
		await this._fileStore.writeJsonFile(this._getDraftFilePath(id), draft);
	}

	async loadDraft(id: string): Promise<AgentDraftSnapshot | null> {
		return this._fileStore.readJsonFile<AgentDraftSnapshot | null>(this._getDraftFilePath(id), null);
	}

	async clearDraft(id: string): Promise<void> {
		const draft = await this.loadDraft(id);
		await this.saveDraft(id, {
			text: "",
			selectedSkillName: draft?.selectedSkillName ?? null,
			updatedAt: Date.now(),
		});
	}

	async load(activeSessionId?: string | null): Promise<void> {
		const sessionIds = await this._fileStore.listDir("sessions");
		for (const session of this._sessions.values()) {
			this.cancel(session.id);
		}
		this._sessions.clear();
		for (const id of sessionIds) {
			const item = await this._fileStore.readJsonFile<ReturnType<AgentSession["toSnapshot"]> | null>(
				this._getSessionFilePath(id),
				null,
			);
			if (!item?.id) continue;
			this._sessions.set(item.id, AgentSession.fromSnapshot(item));
		}
		await this._applySessionsLimit(activeSessionId);
	}

	async create(): Promise<AgentSession> {
		const id = `session-${new Date().toISOString().replace(/[-T:]/g, ".")}`;
		const session = new AgentSession(id, "");
		this._sessions.set(id, session);
		await this._save(id);
		return session;
	}

	get(id: string): AgentSession | undefined {
		return this._sessions.get(id);
	}

	async list(): Promise<ReturnType<AgentSession["toSnapshot"]>[]> {
		return Array.from(this._sessions.values()).map((session) => session.toSnapshot());
	}

	cancel(id: string): boolean {
		const session = this._sessions.get(id);
		const controller = session?.activeRunController;
		if (!controller) return false;
		controller.abort("cancelled_by_user");
		if (session) {
			session.activeRunController = null;
		}
		return true;
	}

	async update(id: string): Promise<void> {
		await this._save(id);
	}

	async delete(id: string): Promise<boolean> {
		const cancelled = this.cancel(id);
		this._sessions.delete(id);
		await this._fileStore.deletePath(`sessions/${id}`);
		return cancelled;
	}
}
