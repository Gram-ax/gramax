import type { AppConfig } from "@app/config/AppConfig";
import type Context from "@core/Context/Context";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type FileStructure from "@core/FileStructue/FileStructure";
import { resetRepo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import BareRepository from "@ext/git/core/Repository/BareRepository";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import NullRepository from "@ext/git/core/Repository/NullRepository";
import type Repository from "@ext/git/core/Repository/Repository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import UserInfo from "@ext/security/logic/User/UserInfo";
import type { ProxiedSourceDataCtx } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import type { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";
import StorageProvider, { type OnCloneFinish } from "@ext/storage/logic/StorageProvider";
import StorageData from "@ext/storage/models/StorageData";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import assert from "assert";

export type RepositoryProviderEvents = Event<"connect-repository", { repo: Repository }>;

export default class RepositoryProvider {
	private _sdp: SourceDataProvider;
	private _sp: StorageProvider;
	private _events = createEventEmitter<RepositoryProviderEvents>();

	constructor(private _config: AppConfig = null) {
		this._sp = new StorageProvider();
	}

	static resetRepo() {
		return resetRepo();
	}

	get events() {
		return this._events;
	}

	addSourceDataProvider(sdp: SourceDataProvider) {
		this._sdp = sdp;
	}

	getSourceDatas(ctx: Context, workspaceId?: WorkspacePath): SourceData[] {
		return this._sdp.withContext(ctx).getSourceDatas(workspaceId);
	}

	removeSource(ctx: Context, storageName: string) {
		this._sdp.withContext(ctx).removeSource(storageName);
	}

	getSourceData<T extends SourceData = SourceData>(
		ctx: Context,
		storageName: string,
		workspaceId?: WorkspacePath,
	): ProxiedSourceDataCtx<T> {
		const sdp = this._sdp.withContext(ctx);
		const isExist = sdp.isSourceExists(storageName, workspaceId);
		if (!isExist) return null;
		return sdp.getSourceByName(storageName, workspaceId) as ProxiedSourceDataCtx<T>;
	}

	getSourceUserInfo(ctx: Context, storageName: string): UserInfo {
		const data = this.getSourceData(ctx, storageName);
		if (!data) return null;
		return { mail: data.userEmail, name: data.userName, id: data.userEmail };
	}

	setSourceData(ctx: Context, data: SourceData, workspaceId?: WorkspacePath): string {
		return this._sdp.withContext(ctx).updateSource(data, workspaceId);
	}

	async getRepositoryByPath(path: Path, fp: FileProvider): Promise<Repository> {
		const gvc = new GitVersionControl(path, fp);
		let storage: Storage;

		try {
			const isInit = await gvc.isInit();
			if (!isInit) return await this._makeRepository(path, fp, null, null);
			storage = await this._sp.getStorageByPath(path, fp, this._config);
			const repo = await this._makeRepository(path, fp, gvc, storage);
			return repo;
		} catch (error) {
			if (error instanceof GitError || error instanceof LibGit2Error)
				return new BrokenRepository(path, fp, gvc, storage).withError(error);
			throw error;
		}
	}

	static null() {
		return NullRepository.instance;
	}

	async update(repo: Repository, fp: FileProvider, newPath: Path): Promise<void> {
		const gvc = new GitVersionControl(newPath, fp);
		const storage = await this._sp.getStorageByPath(newPath, fp, this._config);
		repo.update(newPath, gvc, storage, fp);
	}

	async initNew(path: Path, fp: FileProvider, data: StorageData): Promise<Repository> {
		const gvc = await GitVersionControl.init(fp, path, data.source);
		const storage = await this._sp.initStorage(fp, path, data, this._config);
		const repo = await this._makeRepository(path, fp, gvc, storage);
		await this._events.emit("connect-repository", { repo });
		return repo;
	}

	cleanupProgressCache(fs: FileStructure, entries: Path[]) {
		this._sp.cleanupProgressCache(fs, entries);
	}

	async validateEqualCatalogNames(ctx: Context, path: Path, data: StorageData, storage: Storage): Promise<void> {
		if (!storage) return;

		const isGit = isGitSourceType(await storage.getType()) && isGitSourceType(data.source.sourceType);
		if (!isGit) return;

		const cloneData = data as GitStorageData;

		const sourceData = this.getSourceData(ctx, await storage.getSourceName());
		const repData = (await storage.getStorageData(sourceData)) as GitStorageData;

		const isEqual = cloneData.source.domain === repData.source?.domain && cloneData.group === repData.group;

		if (isEqual) return;
		throw new GitError(GitErrorCode.AlreadyExistsError, null, { repositoryPath: path.value }, "clone");
	}

	tryReviveCloneProgress(workspace: Workspace, path: Path, initProps: CatalogProps, cancelTokens: number[]) {
		return this._sp.tryReviveCloneProgress(workspace, path, initProps, cancelTokens);
	}

	async clone(
		fs: FileStructure,
		path: Path,
		data: StorageData,
		isBare = false,
		branch?: string,
		onCloneFinish?: OnCloneFinish,
	) {
		return await this._sp.clone(fs, { out: path, data, isBare, branch, onFinish: onCloneFinish });
	}

	async recover(repo: BrokenRepository, data: StorageData, onFinish?: OnCloneFinish) {
		assert(data, "StorageData is required");
		assert(
			isGitSourceType(data?.source?.sourceType),
			`data.source.sourceType must be SourceType.git; got ${data.source.sourceType}`,
		);

		return await this._sp.recover(repo, data, onFinish);
	}

	async cancelClone(fs: FileStructure, path: Path) {
		return this._sp.cancelClone(fs, path);
	}

	getCloneProgress(absolutePath: Path) {
		return this._sp.getCloneProgress(absolutePath);
	}

	tryInitEntryCloningStatus(workspacePath: WorkspacePath, catalog: BaseCatalog) {
		const progress = this._sp.getCloneProgress(new Path(workspacePath).join(catalog.basePath));
		if (!progress) return;
		catalog.props.isCloning = true;
	}

	private async _makeRepository(
		path: Path,
		fp: FileProvider,
		gvc: GitVersionControl,
		storage: Storage,
	): Promise<Repository> {
		if (await gvc?.isBare()) return new BareRepository(path, fp, gvc, storage);
		return new WorkdirRepository(path, fp, gvc, storage, this._config?.isReadOnly);
	}
}
