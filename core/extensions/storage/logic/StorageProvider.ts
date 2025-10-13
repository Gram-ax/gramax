import type { AppConfig } from "@app/config/AppConfig";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type FileStructure from "@core/FileStructue/FileStructure";
import { XxHash } from "@core/Hash/Hasher";
import ConfluenceStorage from "@ext/confluence/core/logic/ConfluenceStorage";
import type ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import type { RemoteProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import type BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import t from "@ext/localization/locale/translate";
import NotionStorage from "@ext/notion/logic/NotionStorage";
import type NotionStorageData from "@ext/notion/model/NotionStorageData";
import SharedCloneProgressManager, { SharedCloneProgress } from "@ext/storage/logic/SharedCloneProgress";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import type StorageData from "@ext/storage/models/StorageData";
import type { Workspace } from "@ext/workspace/Workspace";
import assert from "assert";
import Storage from "./Storage";

export type OnCloneFinish = (path: Path, isCancelled: boolean) => Promise<boolean> | boolean;

export type CloneOptions = {
	out: Path;
	data: StorageData;
	branch: string;
	onFinish: OnCloneFinish;
	isBare?: boolean;
	allowNonEmptyDir?: boolean;
};

export type GitStorageCloneResult = {
	isCancelledByUser: boolean;
};

type StorageCloneResult = {
	isCancelledByUser: boolean;
} | null;

export default class StorageProvider {
	private _currentClonePromises = new Set<Promise<GitStorageCloneResult | null>>();
	private _maxConcurrent = 3;

	constructor() {}

	async getStorageByPath(path: Path, fp: FileProvider, config: AppConfig): Promise<Storage> {
		const isInit = await GitStorage.isInit(fp, path);
		if (!isInit) return null;

		return new GitStorage(path, fp, config?.services.auth.url);
	}

	async initStorage(fp: FileProvider, path: Path, data: StorageData, config: AppConfig) {
		if (isGitSourceType(data.source.sourceType)) await GitStorage.init(path, fp, data as GitStorageData);
		return await this.getStorageByPath(path, fp, config);
	}

	async clone(fs: FileStructure, opts: CloneOptions) {
		assert(opts, "clone options are required but not provided");
		assert(opts.out, "out path is required for clone");

		const sharedProgressId = fs.fp.default().rootPath.join(opts.out).toString();
		const progress = SharedCloneProgressManager.instance.createProgress(sharedProgressId, true);
		await this._waitUntilFreeSlot();
		progress.setStarted();

		try {
			const result = await this._takeSlot(async () => await this._cloneStorageBasedOnType(fs, progress, opts));
			const isCancelled = result?.isCancelledByUser ?? false;
			const isCancelledByCallback = await opts.onFinish?.(opts.out, isCancelled);
			progress.setFinish(isCancelled || isCancelledByCallback);
		} catch (e) {
			await this._cleanupOnError(fs, progress, opts.out, e);
		} finally {
			SharedCloneProgressManager.instance.removeAsInProgress(sharedProgressId);
		}
	}

	async recover(repo: BrokenRepository, data: StorageData, onFinish?: OnCloneFinish) {
		assert(repo, "repo is required");
		assert(data?.source, `data.source is required for recover; got ${JSON.stringify(data)}`);

		const sharedProgressId = repo.absolutePath.toString();
		const progress = SharedCloneProgressManager.instance.createProgress(sharedProgressId, false);
		await this._waitUntilFreeSlot();
		progress.setStartedSilent();

		try {
			const result = await this._takeSlot(
				async () =>
					await repo.recover({
						data: data.source as GitSourceData,
						progress,
					}),
			);
			const isCancelled = result?.isCancelledByUser ?? false;
			const isCancelledByCallback = await onFinish?.(repo.absolutePath, isCancelled);
			progress.setFinish(isCancelled || isCancelledByCallback);
		} catch (e) {
			progress.setError(e);
		} finally {
			SharedCloneProgressManager.instance.removeAsInProgress(sharedProgressId);
		}
	}

	async cancelClone(fs: FileStructure, path: Path) {
		assert(path);

		const absolutePath = fs.fp.default().rootPath.join(path);
		const progress = SharedCloneProgressManager.instance.getProgress(absolutePath.toString());
		assert(progress);

		await GitStorage.cancel(progress.cancelToken, fs, path);
	}

	getCloneProgress(absolutePath: Path): RemoteProgress {
		assert(absolutePath);

		const id = absolutePath.toString();
		const shared = SharedCloneProgressManager.instance.getProgress(id);

		if (!shared) return null;
		return { ...shared.progress, cancellable: shared.cancelToken > 0 };
	}

	tryReviveCloneProgress(workspace: Workspace, path: Path, initProps: CatalogProps, cancelTokens: number[]) {
		assert(initProps);
		assert(path);

		if (initProps.isCloning) return;

		const possibleId = workspace.getFileProvider().default().rootPath.join(path).toString();
		if (!SharedCloneProgressManager.instance.hasSavedAsInProgress(possibleId)) return;

		const id = XxHash.hasher().hash(possibleId).finalize();

		if (!cancelTokens.some((e) => e === id) || getExecutingEnvironment() === "browser") return;

		const progress = SharedCloneProgressManager.instance.createProgress(possibleId, false);

		progress.onDone((p) => {
			SharedCloneProgressManager.instance.removeAsInProgress(possibleId);
			if (p.type === "error") void workspace.removeCatalog(path.toString(), true);
			if (p.type === "finish" && p.data.isCancelled) void workspace.removeCatalog(path.toString(), false);
		});

		if (cancelTokens.some((e) => e === id)) {
			initProps.isCloning = true;
			progress.disableTimer();
			progress.withCancelToken(id);
			progress[id] = progress.setProgress.bind(progress);

			return;
		}

		if (getExecutingEnvironment() === "browser") {
			initProps.isCloning = true;
			initProps.cloneCancelDisabled = true;
			progress.startEventWaitTimer(3000);

			return;
		}

		SharedCloneProgressManager.instance.removeAsInProgress(possibleId);
	}

	cleanupProgressCache(fs: FileStructure, entries: Path[]) {
		const root = fs.fp.default().rootPath.toString() + "/";
		const all = SharedCloneProgressManager.instance.getAllSavedAsInProgress().filter((e) => e.startsWith(root));
		const ids = entries.map((e) => fs.fp.default().rootPath.join(e).toString());
		for (const saved of all) {
			if (!ids.some((e) => e === saved)) SharedCloneProgressManager.instance.removeAsInProgress(saved);
		}
	}

	private async _cloneStorageBasedOnType(
		fs: FileStructure,
		progress: SharedCloneProgress,
		opts: CloneOptions,
	): Promise<StorageCloneResult> {
		const { data } = opts;
		const sourceType = data.source?.sourceType;
		assert(sourceType, "source.sourceType is required");

		if (isGitSourceType(sourceType)) return await this._cloneGitStorage(fs, progress, opts);

		progress.setStartedSilent();

		if (sourceType === SourceType.confluenceCloud || sourceType === SourceType.confluenceServer)
			return await this._cloneConfluenceStorage(fs, opts);
		if (sourceType === SourceType.notion) return await this._cloneNotionStorage(fs, opts);
	}

	private async _cloneGitStorage(
		fs: FileStructure,
		progress: SharedCloneProgress,
		opts: CloneOptions,
	): Promise<GitStorageCloneResult> {
		const { data, out, branch, isBare } = opts;

		const absoluteOut = fs.fp.default().rootPath.join(out);

		const cancelToken = XxHash.hasher().hash(absoluteOut).finalize();
		let isCancelledByUser = false;

		progress.withCancelToken(cancelToken);
		progress.disableTimer();

		try {
			await GitStorage.clone({
				fs,
				branch,
				allowNonEmptyDir: opts.allowNonEmptyDir,
				repositoryPath: out,
				data: data as GitStorageData,
				source: data.source as GitSourceData,
				cancelToken,
				isBare,
				onProgress: progress.setProgress.bind(progress),
			});
		} catch (e) {
			const isCancelled =
				e.props?.errorCode === GitErrorCode.CancelledOperation ||
				e.cause?.props?.errorCode === GitErrorCode.CancelledOperation;

			if (isCancelled) {
				isCancelledByUser = true;
				return { isCancelledByUser };
			}

			throw e;
		}

		return { isCancelledByUser };
	}

	private async _cloneConfluenceStorage(fs: FileStructure, opts: CloneOptions) {
		const { data, out } = opts;

		await ConfluenceStorage.clone({
			fs,
			data: data as ConfluenceStorageData,
			catalogPath: out,
		});

		return null;
	}

	private async _cloneNotionStorage(fs: FileStructure, opts: CloneOptions) {
		const { data, out } = opts;

		await NotionStorage.clone({
			fs,
			data: data as NotionStorageData,
			catalogPath: out,
		});

		return null;
	}

	private async _cleanupOnError(
		fs: FileStructure,
		progress: SharedCloneProgress,
		path: Path,
		e: Error | DefaultError,
	) {
		if (await fs.fp.exists(path)) await fs.fp.delete(path);

		if (e instanceof DefaultError) {
			progress.setError(e);
			return;
		}

		const message = t("git.clone.error.generic");
		const title = t("git.clone.error.cannot-clone");
		progress.setError(new DefaultError(message, e, { showCause: true }, null, title));
	}

	private async _takeSlot(action: () => Promise<GitStorageCloneResult>): Promise<GitStorageCloneResult> {
		let promise: Promise<GitStorageCloneResult>;
		try {
			promise = action();
			this._currentClonePromises.add(promise);
			return await promise;
		} finally {
			this._currentClonePromises.delete(promise);
		}
	}

	private async _waitUntilFreeSlot() {
		while (this._currentClonePromises.size >= this._maxConcurrent) {
			await Promise.race(this._currentClonePromises);
		}
	}
}
