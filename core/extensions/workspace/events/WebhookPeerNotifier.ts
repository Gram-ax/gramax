import { env } from "@app/resolveModule/env";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import { Level, span, traced } from "@ext/loggers/opentelemetry";
import notifyPeers from "@ext/publicApi/webhook/notifyPeers";
import type { Workspace } from "@ext/workspace/Workspace";

// Collapse the burst of events a single git op emits (a checkout fires checkout + sync + reset) into one
// peer notification per catalog.
const DEBOUNCE_MS = 500;

// Broadcasts a peer-refresh whenever this instance changes a catalog on disk. Replicas on a shared volume
// then re-read (or drop) the catalog — see Workspace.reconcileCatalogFromDisk. No-ops unless both WEBHOOK_PEERS
// and WEBHOOK_SECRET are configured. Notification is fire-and-forget so it never blocks the git op.
export default class WebhookPeerNotifier implements EventHandlerCollection {
	private _timers = new Map<string, ReturnType<typeof setTimeout>>();

	constructor(
		private _workspace: Workspace,
		private _delayMs: number = DEBOUNCE_MS,
	) {}

	mount(): void {
		const e = this._workspace.events;
		e.on("add-catalog", ({ catalog }) => this._schedule(catalog.name, "clone"));
		e.on("sync", ({ catalog }) => this._schedule(catalog.name, "sync"));
		e.on("merge", ({ catalog }) => this._schedule(catalog.name, "merge"));
		e.on("checkout", ({ catalog }) => this._schedule(catalog.name, "checkout"));
		e.on("reset", ({ catalog }) => this._schedule(catalog.name, "reset"));
		e.on("remove-catalog", ({ name }) => this._schedule(name, "remove"));
	}

	private _schedule(catalogName: string, action: string): void {
		if (!env("WEBHOOK_PEERS") || !env("WEBHOOK_SECRET")) return;

		const pending = this._timers.get(catalogName);
		if (pending) clearTimeout(pending);

		this._timers.set(
			catalogName,
			setTimeout(() => {
				this._timers.delete(catalogName);
				void this._notify(catalogName, action);
			}, this._delayMs),
		);
	}

	private async _notify(catalogName: string, action: string): Promise<void> {
		await traced("webhook-peer-refresh", { level: Level.Internal }, async () => {
			span()?.setAttributes({ catalog: catalogName, action });
			await notifyPeers(catalogName, env("WEBHOOK_SECRET"), action);
		});
	}
}
