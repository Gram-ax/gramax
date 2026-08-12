import { env } from "@app/resolveModule/env";
import type Logger from "@ext/loggers/Logger";
import { addEvent, Level } from "@ext/loggers/opentelemetry";

const PEER_REFRESH_TIMEOUT_MS = 5000;

const getPeers = (): string[] =>
	env("WEBHOOK_PEERS")
		.split(",")
		.map((s) => s.trim().replace(/\/+$/, ""))
		.filter(Boolean);

// Tell sibling instances (replicas on a shared volume) to re-read a catalog after this instance changed it
// on disk (pull, clone, checkout, destructive git op, removal). Each peer decides refresh-vs-remove by
// checking the catalog on disk — see handleWebhookRefresh. Best-effort: one attempt per peer, a peer being
// down only logs. `secret` is WEBHOOK_SECRET, reused as the peer-to-peer X-Webhook-Token.
const notifyPeers = async (catalogName: string, secret: string, action: string, logger?: Logger): Promise<void> => {
	const peers = getPeers();
	if (!peers.length || !secret) return;

	await Promise.allSettled(
		peers.map(async (peer) => {
			try {
				const res = await fetch(`${peer}/api/webhook/refresh/${encodeURIComponent(catalogName)}`, {
					method: "POST",
					headers: { "X-Webhook-Token": secret },
					signal: AbortSignal.timeout(PEER_REFRESH_TIMEOUT_MS),
				});
				addEvent("peer-refresh", Level.Full, { peer, catalog: catalogName, action, status: res.status });
				if (!res.ok) logger?.logWarning(`Peer refresh failed: ${peer} -> ${res.status} for "${catalogName}"`);
			} catch (error) {
				addEvent("peer-refresh", Level.Full, {
					peer,
					catalog: catalogName,
					action,
					status: "error",
					message: String(error),
				});
				logger?.logWarning(`Peer refresh failed: ${peer} for "${catalogName}": ${error}`);
			}
		}),
	);
};

export default notifyPeers;
