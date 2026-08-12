import { env } from "@app/resolveModule/env";
import { getWebhookSourceData, pullCatalog } from "@core/AutoPull/AutoPull";
import { markWebhookPull, releasePull, tryAcquirePull } from "@core/AutoPull/PullDebounce";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type Logger from "@ext/loggers/Logger";
import { addEvent, Level } from "@ext/loggers/opentelemetry";
import type { Workspace } from "@ext/workspace/Workspace";
import normalizeGitUrl from "./normalizeGitUrl";
import notifyPeers from "./notifyPeers";
import parsePushEvent, { type WebhookProvider } from "./parsePushEvent";
import { verifyGitHubSignature, verifyToken } from "./verifySignature";

export type WebhookDeps = {
	pull?: typeof pullCatalog;
	logger?: Logger;
};

export type WebhookResult = {
	status: number;
	body?: object;
};

export type WebhookRequestInput = {
	headers: { [name: string]: string };
	rawBody: string;
	body: unknown;
};

const findCatalogByRemoteUrl = async (workspace: Workspace, repoUrls: string[]): Promise<BaseCatalog | null> => {
	const targets = new Set(repoUrls.map(normalizeGitUrl).filter(Boolean));
	for (const catalog of workspace.getAllCatalogs().values()) {
		const storage = catalog.repo?.storage;
		if (!storage) continue;
		try {
			const url = normalizeGitUrl(String(await (storage as { getUrl(): Promise<string> }).getUrl()));
			if (url && targets.has(url)) return catalog;
		} catch {
			// catalog without a resolvable remote — not a webhook target
		}
	}
	return null;
};

const pullInBackground = async (catalog: BaseCatalog, secret: string, deps: WebhookDeps): Promise<void> => {
	if (!tryAcquirePull(catalog.name)) return;
	try {
		const pull = deps.pull ?? pullCatalog;
		const outcome = await pull(catalog, deps.logger, getWebhookSourceData);
		markWebhookPull(catalog.name);
		if (outcome === "pulled") await notifyPeers(catalog.name, secret, "pull", deps.logger);
	} finally {
		releasePull(catalog.name);
	}
};

export const handleWebhookPush = async (
	input: WebhookRequestInput,
	workspace: Workspace,
	deps: WebhookDeps = {},
): Promise<WebhookResult> => {
	const secret = env("WEBHOOK_SECRET");
	if (!secret) return { status: 404 };

	const { headers, rawBody, body } = input;
	let provider: WebhookProvider;
	// Verify the signature/token before branching on the event type — otherwise non-push events leak
	// whether the webhook is configured (200 vs 404) to unauthenticated callers. Ping/non-push events
	// from GitHub/GitLab are signed too.
	if (headers["x-github-event"]) {
		if (!verifyGitHubSignature(rawBody, headers["x-hub-signature-256"], secret)) return { status: 401 };
		if (headers["x-github-event"] !== "push")
			return { status: 200, body: { status: "ignored", reason: "not a push event" } };
		provider = "github";
	} else if (headers["x-gitlab-event"]) {
		if (!verifyToken(headers["x-gitlab-token"], secret)) return { status: 401 };
		if (headers["x-gitlab-event"] !== "Push Hook")
			return { status: 200, body: { status: "ignored", reason: "not a push event" } };
		provider = "gitlab";
	} else {
		return { status: 400 };
	}

	const event = parsePushEvent(provider, body);
	if (!event) return { status: 400 };
	if (!event.branch) return { status: 200, body: { status: "ignored", reason: "not a branch push" } };

	const catalog = await findCatalogByRemoteUrl(workspace, event.repoUrls);
	if (!catalog) return { status: 200, body: { status: "ignored", reason: "no catalog matches repository" } };

	const currentBranch = await catalog.repo.gvc.getCurrentBranchName();
	if (currentBranch !== event.branch)
		return { status: 200, body: { status: "ignored", reason: "ref does not match catalog branch" } };

	void pullInBackground(catalog, secret, deps).catch((error) => {
		addEvent("webhook-pull", Level.Commands, { catalog: catalog.name, status: "error", message: String(error) });
		deps.logger?.logWarning(`Webhook pull failed for "${catalog.name}": ${error}`);
	});

	return { status: 200, body: { status: "accepted", catalog: catalog.name } };
};

export const handleWebhookRefresh = async (
	headers: { [name: string]: string },
	workspace: Workspace,
	catalogName: string,
): Promise<WebhookResult> => {
	const secret = env("WEBHOOK_SECRET");
	if (!secret) return { status: 404 };
	if (!verifyToken(headers["x-webhook-token"], secret)) return { status: 401 };

	// Re-read the catalog list from disk and reconcile in-memory state with it: a peer may have just cloned
	// (add), pulled/checked-out/reset (refresh), or removed (drop from memory) the catalog on the shared volume.
	const result = await workspace.reconcileCatalogFromDisk(catalogName);
	if (result === "not-found") return { status: 404 };
	return { status: 200, body: { status: result, catalog: catalogName } };
};
