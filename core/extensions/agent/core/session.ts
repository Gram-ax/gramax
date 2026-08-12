import type { CommandTree } from "@app/commands";
import type Application from "@app/types/Application";
import type Context from "@core/Context/Context";
import type { AgentBrowserSessionMeta } from "../browser/browserHost";
import { agentLlmConfig } from "../llm";
import type { AgentLlmClient } from "../llm/agentLlmClient";
import { AGENT_PROMPT_MAP } from "../prompts/agentPromptMap";
import { AgentErrorType, AgentWarningType, isAgentError } from "./agentError";
import type { AgentAttachment } from "./attachmentStore";
import type { AgentEvent } from "./events";
import { runAgentTurn } from "./loop";

export type AgentUsage = {
	totalUsage: number;
	lastTurnUsage: number;
	cacheHitTokens: number;
	cacheMissTokens: number;
	contextTokensUsed: number;
	contextWindowTokens: number;
	contextUsagePercent: number;
};

export class AgentSession {
	readonly id: string;
	title: string;
	openCatalogName: string | null = null;
	openItemPath: string | null = null;
	cancelled = false;
	runChain: Promise<void> = Promise.resolve();
	activeRunController: AbortController | null = null;
	processing = false;
	lastError: string | null = null;
	events: AgentEvent[] = [];
	browser: AgentBrowserSessionMeta = {
		active: false,
		visible: false,
	};
	usage: AgentUsage = {
		totalUsage: 0,
		lastTurnUsage: 0,
		cacheHitTokens: 0,
		cacheMissTokens: 0,
		contextTokensUsed: 0,
		contextWindowTokens: 0,
		contextUsagePercent: 0,
	};

	constructor(id: string, title: string) {
		this.id = id;
		this.title = title;
	}

	toSnapshot() {
		const { runChain, activeRunController, browser, ...snapshot } = this;
		return snapshot;
	}

	static fromSnapshot(snapshot: ReturnType<AgentSession["toSnapshot"]>): AgentSession {
		return Object.assign(new AgentSession(snapshot.id, snapshot.title), snapshot);
	}

	updateUsage(
		prompt_tokens_usage: number,
		total_tokens_usage: number,
		cache_hit_tokens_usage: number,
		cache_miss_tokens_usage: number,
		contextWindowTokens: number,
	): void {
		this.usage.totalUsage += total_tokens_usage;
		this.usage.lastTurnUsage += total_tokens_usage;
		this.usage.cacheHitTokens += cache_hit_tokens_usage;
		this.usage.cacheMissTokens += cache_miss_tokens_usage;

		this.usage.contextWindowTokens = contextWindowTokens;
		if (prompt_tokens_usage > 0) {
			this.usage.contextTokensUsed = prompt_tokens_usage;
			if (contextWindowTokens > 0) {
				const percent = (prompt_tokens_usage / contextWindowTokens) * 100;
				this.usage.contextUsagePercent = Math.max(0, Math.min(100, percent));
			}
		}
	}

	lastAssistantReply(): string {
		if (!this.events.length) return "";
		for (let i = this.events.length - 1; i >= 0; i--) {
			const e = this.events[i];
			if (e.type === "assistant_message") return e.content;
		}
		return "";
	}

	async enqueueUserMessage(
		userText: string,
		attachments: AgentAttachment[],
		llmClient: AgentLlmClient,
		app: Application,
		ctx: Context,
		commands: CommandTree,
		openCatalogName?: string,
		openItemPath?: string,
		useSkill?: string,
	): Promise<void> {
		const content = userText.trim();
		const isFirstUserMessage = !this.events.some((event) => event.type === "user_message");
		if (isFirstUserMessage) {
			this.title = content;
		}
		const turnId = `turn-${globalThis.crypto.randomUUID()}`;
		this.openCatalogName = openCatalogName ?? null;
		this.openItemPath = openItemPath ?? null;
		const userEvent: AgentEvent = {
			type: "user_message",
			turnId,
			ts: Date.now(),
			content,
			browserAllowed: app.agentManager.browserAllowed,
			attachments,
			useSkill,
			openCatalogName,
			openItemPath,
		};
		this.events.push(userEvent);
		await app.agentManager.sessions.update(this.id);
		if (isFirstUserMessage) {
			void this._generateAutoTitle(content, llmClient, app);
		}

		this.runChain = this.runChain.then(() => this._runOneTurn(turnId, llmClient, app, ctx, commands));
		await this.runChain;
	}

	private async _generateAutoTitle(userMessage: string, llmClient: AgentLlmClient, app: Application): Promise<void> {
		const content = userMessage.trim();
		if (!content) return;
		const messages = [
			{
				role: "system" as const,
				content: AGENT_PROMPT_MAP.titleRequestSystemPrompt,
			},
			{
				role: "user" as const,
				content,
			},
		];
		try {
			const completion = await llmClient.chat.streamIteration(
				llmClient.adapter,
				messages,
				undefined,
				() => {},
				undefined,
			);
			const title = completion.content?.trim();
			if (!title) return;
			this.title = title;
			await app.agentManager.sessions.update(this.id);
		} catch {}
	}

	private async _runOneTurn(
		turnId: string,
		llmClient: AgentLlmClient,
		app: Application,
		ctx: Context,
		commands: CommandTree,
	): Promise<void> {
		this.processing = true;
		this.lastError = null;
		this.usage.lastTurnUsage = 0;
		const contextWindowTokens = agentLlmConfig.contextWindowTokens;
		const runAbort = new AbortController();
		this.activeRunController = runAbort;

		try {
			await runAgentTurn({
				turnId,
				sessionId: this.id,
				app,
				ctx,
				commands,
				llmClient,
				events: this.events,
				callbacks: {
					onEvent: (e) => {
						this.events.push(e);
						if (e.type === "error") {
							this.lastError = e.message;
						}
					},
				},
				onLlmUsage: (usage) => {
					this.updateUsage(
						usage.prompt_tokens,
						usage.total_tokens,
						usage.prompt_cache_hit_tokens,
						usage.prompt_cache_miss_tokens,
						contextWindowTokens,
					);
					if (usage.prompt_cache_hit_tokens === 0) {
						this.events.push({
							type: "warning",
							turnId,
							ts: Date.now(),
							message: "Zero cache hits in agent context",
							warningType: AgentWarningType.CacheHitZero,
						});
					}
				},
				signal: runAbort.signal,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			const errorType = isAgentError(err) ? err.errorType : AgentErrorType.Unexpected;
			if (!runAbort.signal.aborted) {
				this.lastError = message;
				const ev: AgentEvent = { type: "error", turnId, ts: Date.now(), message, errorType };
				this.events.push(ev);
			}
		} finally {
			const status = runAbort.signal.aborted ? "cancelled" : this.lastError ? "failed" : "completed";
			this.events.push({
				type: "turn_finished",
				turnId,
				ts: Date.now(),
				status,
				refreshPage: true,
			});
			if (this.activeRunController === runAbort) {
				this.activeRunController = null;
			}
			this.processing = false;
			await app.agentManager.sessions.update(this.id);
		}
	}
}
