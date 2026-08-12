import { env } from "@app/resolveModule/env";
import type Application from "@app/types/Application";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type GitSourceType from "@ext/git/core/model/GitSourceType";
import type Logger from "@ext/loggers/Logger";
import { addEvent, Level, trace, traced } from "@ext/loggers/opentelemetry";
import SourceDataCtx from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import type { Workspace } from "@ext/workspace/Workspace";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { releasePull, shouldSkipAutoPull, tryAcquirePull } from "./PullDebounce";

const DEFAULT_AUTO_PULL_INTERVAL = 180;
const DEFAULT_AUTO_PULL_DELAY = 100;

// setTimeout stores its delay in a signed 32-bit int: anything above 2^31-1 ms wraps to 1 ms and fires
// right away, turning a long interval into a hot loop. Cap it instead — 24.8 days between pulls is already
// "practically off". Number.MAX_SAFE_INTEGER is no help here: the limit is the timer's, not the number type's.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

// Timed auto-pull interval in ms, or null when it must stay off.
// A negative AUTO_PULL_INTERVAL (e.g. -1) disables the timer entirely — catalogs then update via webhook only.
export const resolveAutoPullIntervalMs = (raw: string | number | undefined): number | null => {
	const seconds = Number(raw);
	if (seconds < 0) return null;
	return Math.min((seconds || DEFAULT_AUTO_PULL_INTERVAL) * 1000, MAX_TIMEOUT_MS);
};

const toGitSourceType = (sourceType: SourceType): GitSourceType | null => {
	switch (sourceType) {
		case SourceType.git:
		case SourceType.gitHub:
		case SourceType.gitLab:
		case SourceType.gitVerse:
		case SourceType.gitea:
			return sourceType;
		default:
			return null;
	}
};

// Builds git credentials from a token. Returns null when the token is unset or the source is non-git —
// callers treat null as "pull disabled / skip" without an extra guard.
const buildSourceData = (
	sourceName: string,
	sourceType: SourceType,
	token: string,
	gitServerUsername: string,
): GitSourceData | null => {
	const gitSourceType = toGitSourceType(sourceType);
	if (!token || !gitSourceType) return null;

	const sourceData: GitSourceData = {
		sourceType: gitSourceType,
		domain: sourceName,
		userName: "autopull",
		gitServerUsername,
		userEmail: "autopull",
		token,
	};

	return SourceDataCtx.init<GitSourceData>(sourceData, null, null);
};

export type PullSourceDataProvider = (sourceName: string, sourceType: SourceType) => GitSourceData | null;

// Timed auto-pull credentials — gated by AUTO_PULL_TOKEN.
export const getAutoPullSourceData: PullSourceDataProvider = (sourceName, sourceType) =>
	buildSourceData(sourceName, sourceType, env("AUTO_PULL_TOKEN"), env("AUTO_PULL_USERNAME") || "autopull");

// Webhook-triggered pull credentials — prefer the dedicated WEBHOOK_TOKEN, fall back to AUTO_PULL_TOKEN so
// deployments that only configured auto-pull keep working when webhook pulls are introduced.
export const getWebhookSourceData: PullSourceDataProvider = (sourceName, sourceType) =>
	buildSourceData(
		sourceName,
		sourceType,
		env("WEBHOOK_TOKEN") || env("AUTO_PULL_TOKEN"),
		env("AUTO_PULL_USERNAME") || "autopull",
	);

// How a single pull attempt ended. Telemetry alone is not enough to debug a silent auto-pull: spans below
// the `important` level are dropped by default and a deployment may have no exporter at all, so the outcome
// is also counted into a per-cycle summary that goes to the logger.
export type PullOutcome = "pulled" | "up-to-date" | "no-storage" | "no-source-data" | "error";

export const pullCatalog = async (
	catalog: BaseCatalog,
	logger?: Logger,
	getSourceData: PullSourceDataProvider = getAutoPullSourceData,
): Promise<PullOutcome> => {
	try {
		if (!catalog?.repo?.storage) {
			addEvent("pull", Level.Internal, { catalog: catalog?.name, status: "skip", reason: "no storage" });
			return "no-storage";
		}

		const storage = catalog.repo.storage;
		const sourceData = getSourceData(await storage.getSourceName(), await storage.getType());
		if (!sourceData) {
			addEvent("pull", Level.Important, { catalog: catalog.name, status: "skip", reason: "no source data" });
			logger?.logWarning(
				`Auto-pull has no credentials for "${catalog.name}": the token is empty or the catalog storage ` +
					`is not a supported git source. Check AUTO_PULL_TOKEN and the catalog remote`,
			);
			return "no-source-data";
		}

		if (await catalog.repo.isShouldSync({ data: sourceData, shouldFetch: true })) {
			logger?.logInfo(`Auto-pull started for "${catalog.name}" catalog`);
			await catalog.repo.sync({
				data: sourceData,
				onPull: () => {
					addEvent("pull", Level.Important, { catalog: catalog.name, status: "success" });
				},
			});
			return "pulled";
		}
		addEvent("pull", Level.Internal, { catalog: catalog.name, status: "skip" });
		return "up-to-date";
	} catch (error) {
		addEvent("pull", Level.Commands, { catalog: catalog?.name, status: "error", message: String(error) });
		logger?.logWarning(`Error occurred while pulling "${catalog?.name}" catalog: ${error}`);
		return "error";
	}
};

export type PullCycleSummary = {
	total: number;
	pulled: number;
	upToDate: number;
	skipped: number;
	failed: number;
};

const countOutcome = (summary: PullCycleSummary, outcome: PullOutcome): void => {
	if (outcome === "pulled") summary.pulled++;
	else if (outcome === "up-to-date") summary.upToDate++;
	else if (outcome === "error") summary.failed++;
	else summary.skipped++;
};

export class AutoPull {
	private _wm: WorkspaceManager;
	private _logger: Logger;
	private _pullInterval: number;
	private _pullDelay: number;

	@trace({ level: Level.Commands })
	async start(app: Promise<Application>): Promise<void> {
		const { logger, wm } = await app;
		this._logger = logger;

		if (!env("AUTO_PULL_TOKEN")) {
			addEvent("auto-pull", Level.Important, { status: "disabled", reason: "no token set" });
			logger.logWarning("AUTO_PULL_TOKEN is not set. Auto-pull is disabled");
			return;
		}

		const intervalMs = resolveAutoPullIntervalMs(env("AUTO_PULL_INTERVAL"));
		if (intervalMs === null) {
			addEvent("auto-pull", Level.Important, { status: "disabled", reason: "negative interval" });
			logger.logInfo(
				"AUTO_PULL_INTERVAL is negative. Timed auto-pull is disabled; catalogs update via webhook only",
			);
			return;
		}

		this._wm = wm;
		this._pullInterval = intervalMs;
		this._pullDelay = Number(env("AUTO_PULL_DELAY")) || DEFAULT_AUTO_PULL_DELAY;

		addEvent("auto-pull", Level.Important, {
			status: "enabled",
			interval: this._pullInterval,
			delay: this._pullDelay,
		});
		logger.logInfo(`Auto pull enabled with interval: ${this._pullInterval / 1000}s`);

		// Run once at startup, then on the timer — the cycle re-arms it itself. The timer is one-shot from
		// process start, so without this a long interval hides a broken setup until the first tick, which at
		// AUTO_PULL_INTERVAL=86400 is a whole day of silence.
		void this._runPullCycle();
	}

	private _scheduleNextCycle(): void {
		setTimeout(() => void this._runPullCycle(), this._pullInterval);
	}

	// The next cycle is armed in `finally`, never at the tail of the pull loop: `wm.current()` throws
	// NoActiveWorkspace when no workspace is selected, and any throw before the re-arm used to end the chain
	// for good — auto-pull then stayed dead until the process restarted, silently and for the whole uptime.
	private async _runPullCycle(): Promise<void> {
		try {
			const summary = await traced("auto-pull-cycle", { level: Level.Commands }, () =>
				this._pullCatalogs(this._wm.current()),
			);
			this._logger.logInfo(
				`Auto-pull cycle done: ${summary.pulled} pulled, ${summary.upToDate} up to date, ` +
					`${summary.skipped} skipped, ${summary.failed} failed of ${summary.total} catalogs`,
			);
		} catch (error) {
			// The span itself is already gone by now — `traced` recorded the exception on it. Only the log line
			// is left to write, and it is the one an operator without an OTel exporter will actually see.
			this._logger.logWarning(`Auto-pull cycle failed: ${error}`);
		} finally {
			this._scheduleNextCycle();
		}
	}

	@trace({ level: Level.Internal })
	private async _pullCatalog(catalog: BaseCatalog): Promise<PullOutcome> {
		return await pullCatalog(catalog, this._logger);
	}

	private async _pullCatalogs(workspace: Workspace): Promise<PullCycleSummary> {
		const catalogEntries = Array.from(workspace.getAllCatalogs().values());
		const summary: PullCycleSummary = {
			total: catalogEntries.length,
			pulled: 0,
			upToDate: 0,
			skipped: 0,
			failed: 0,
		};

		for (const catalogEntry of catalogEntries) {
			if (shouldSkipAutoPull(catalogEntry.name, this._pullInterval)) {
				addEvent("pull", Level.Internal, { catalog: catalogEntry.name, status: "debounced" });
				summary.skipped++;
				continue;
			}
			// Share the in-flight guard with the webhook handler so auto-pull and a webhook-triggered
			// pull never run sync on the same catalog concurrently.
			if (!tryAcquirePull(catalogEntry.name)) {
				addEvent("pull", Level.Internal, { catalog: catalogEntry.name, status: "in-flight" });
				summary.skipped++;
				continue;
			}
			// One broken catalog must not cost the remaining ones their pull.
			try {
				countOutcome(summary, await this._pullCatalog(catalogEntry));
			} catch (error) {
				summary.failed++;
				addEvent("pull", Level.Commands, {
					catalog: catalogEntry.name,
					status: "error",
					message: String(error),
				});
				this._logger.logWarning(`Error occurred while pulling "${catalogEntry.name}" catalog: ${error}`);
			} finally {
				releasePull(catalogEntry.name);
			}
			await new Promise((r) => setTimeout(r, this._pullDelay));
		}

		addEvent("auto-pull", Level.Important, { status: "cycle-done", ...summary });
		return summary;
	}
}

const initAutoPull = async (app: Promise<Application>): Promise<void> => {
	await new AutoPull().start(app);
};

export default initAutoPull;
