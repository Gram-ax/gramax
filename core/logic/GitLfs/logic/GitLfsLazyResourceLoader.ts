import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type ResourceManager from "@core/Resource/ResourceManager";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { addEvent, Level, traced } from "@ext/loggers/opentelemetry";
import { treeScopeKey } from "@ext/versioning/GitTreeScopeParser";
import { isLikelyLfsPointer } from "./isLikelyLfsPointer";
import { pullGitLfsObjects, resolveGitLfsSourceData } from "./pullGitLfsObjects";
import { resolveLfsPullTarget } from "./resolveLfsPullTarget";

type PullTarget = {
	path: Path;
	scope?: TreeReadScope;
};

type BatchState = {
	paths: Set<string>;
	promise: Promise<void>;
	resolve: () => void;
	reject: (reason?: Error) => void;
	sourceData: GitSourceData;
	scope?: TreeReadScope;
	scopeKey: string;
	debounceTimeoutId: NodeJS.Timeout | null;
	maxTimeoutId: NodeJS.Timeout | null;
};

export default class GitLfsLazyResourceLoader implements EventHandlerCollection {
	private _current: BatchState | null = null;

	private _batchTimeout = 300;
	private _batchMaxTimeout = 1700;

	constructor(
		private _catalog: BaseCatalog | ReadonlyCatalog,
		private _resourceManager: ResourceManager,
		private _rp: RepositoryProvider,
		private _fp?: FileProvider,
	) {}

	mount(): void {
		this._resourceManager.events.on("content-read", async ({ path, ctx, content, out }) => {
			if (!content || !isLikelyLfsPointer(content) || !ctx) return;

			const sourceData = await resolveGitLfsSourceData({ catalog: this._catalog, ctx, rp: this._rp });
			if (!sourceData) return;

			const target = this._resolvePullTarget(path);
			await this._batched(target, sourceData);
			out.out = true;
		});
	}

	private _resolvePullTarget(path: Path): PullTarget {
		const target = this._fp ? resolveLfsPullTarget(this._fp, this._toAbsolute(path)) : null;
		if (!target) return { path: this._toRepoRelative(path) };

		if (target.scope)
			addEvent("scoped-pull", Level.Full, { path: target.path.value, scope: JSON.stringify(target.scope) });
		return target;
	}

	private _toAbsolute(path: Path): Path {
		const rootPath = this._resourceManager.rootPath;
		return rootPath ? rootPath.join(path) : path;
	}

	private _toRepoRelative(path: Path): Path {
		const rootPath = this._resourceManager.rootPath;
		if (!rootPath) return path;
		const absolute = rootPath.join(path);
		const repoPath = this._catalog.repo.path;
		const relative = repoPath.subDirectory(absolute);
		if (!relative) {
			addEvent("path-fallback", Level.Full, {
				path: path.value,
				absolute: absolute.value,
				repoPath: repoPath.value,
			});
			return path;
		}
		return relative;
	}

	private _batched(target: PullTarget, sourceData: GitSourceData): Promise<void> {
		const batch = this._ensureBatch(sourceData, target.scope);
		batch.paths.add(target.path.value);

		this._armTimers(batch);
		return batch.promise;
	}

	private _ensureBatch(sourceData: GitSourceData, scope?: TreeReadScope): BatchState {
		// paths from different scopes resolve against different git trees, so they never share a batch
		const scopeKey = treeScopeKey(scope);

		if (
			this._current &&
			(this._current.sourceData.token !== sourceData.token || this._current.scopeKey !== scopeKey)
		) {
			this._flush(this._current);
		}

		if (this._current) return this._current;

		let resolve!: () => void;
		let reject!: (reason?: Error) => void;
		const promise = new Promise<void>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this._current = {
			paths: new Set(),
			promise,
			resolve,
			reject,
			sourceData,
			scope,
			scopeKey,
			debounceTimeoutId: null,
			maxTimeoutId: null,
		};
		return this._current;
	}

	private _armTimers(batch: BatchState) {
		if (batch.debounceTimeoutId) clearTimeout(batch.debounceTimeoutId);
		batch.debounceTimeoutId = setTimeout(() => this._flush(batch), this._batchTimeout);

		if (!batch.maxTimeoutId) {
			batch.maxTimeoutId = setTimeout(() => this._flush(batch), this._batchMaxTimeout);
		}
	}

	private _flush(batch: BatchState) {
		if (batch.debounceTimeoutId === null && batch.maxTimeoutId === null && batch.paths.size === 0) {
			addEvent("flush-noop", Level.Full);
			return;
		}

		if (batch.debounceTimeoutId) {
			clearTimeout(batch.debounceTimeoutId);
			batch.debounceTimeoutId = null;
		}
		if (batch.maxTimeoutId) {
			clearTimeout(batch.maxTimeoutId);
			batch.maxTimeoutId = null;
		}

		if (this._current === batch) this._current = null;

		const paths = Array.from(batch.paths, (p) => new Path(p));
		batch.paths.clear();

		const repo = this._catalog.repo;
		if (!repo?.gvc) {
			batch.reject(new Error("provided catalog does not have gvc; can not perform batched lfs pull"));
			return;
		}

		void traced("lfs-batch-pull", { level: Level.Internal }, async () => {
			try {
				await pullGitLfsObjects({
					catalog: this._catalog,
					paths,
					rp: this._rp,
					sourceData: batch.sourceData,
					scope: batch.scope,
				});
				addEvent("done", Level.Internal, { count: paths.length });
				batch.resolve();
			} catch (e) {
				addEvent("error", Level.Commands, {
					error: String(e),
					count: paths.length,
				});
				batch.reject(e);
			}
		});
	}
}
