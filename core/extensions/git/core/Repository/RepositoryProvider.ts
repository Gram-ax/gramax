import type { AppConfig } from "@app/config/AppConfig";
import type Context from "@core/Context/Context";
import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import type BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import { resetRepo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import BareRepository from "@ext/git/core/Repository/BareRepository";
import NullRepository from "@ext/git/core/Repository/NullRepository";
import type Repository from "@ext/git/core/Repository/Repository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import UserInfo from "@ext/security/logic/User/UserInfo";
import type { ProxiedSourceDataCtx } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import type { SourceDataProvider } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";
import StorageProvider from "@ext/storage/logic/StorageProvider";
import StorageData from "@ext/storage/models/StorageData";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

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

	getSourceDatas(ctx: Context): SourceData[] {
		return this._sdp.withContext(ctx).getSourceDatas();
	}

	removeSource(ctx: Context, storageName: string) {
		this._sdp.withContext(ctx).removeSource(storageName);
	}

	getSourceData<T extends SourceData = SourceData>(ctx: Context, storageName: string): ProxiedSourceDataCtx<T> {
		const sdp = this._sdp.withContext(ctx);
		const isExist = sdp.isSourceExists(storageName);
		if (!isExist) return null;
		return sdp.getSourceByName(storageName) as ProxiedSourceDataCtx<T>;
	}

	getSourceUserInfo(ctx: Context, storageName: string): UserInfo {
		const data = this.getSourceData(ctx, storageName);
		if (!data) return null;
		return { mail: data.userEmail, name: data.userName, id: data.userEmail };
	}

	setSourceData(ctx: Context, data: SourceData): string {
		return this._sdp.withContext(ctx).updateSource(data);
	}

	async getRepositoryByPath(path: Path, fp: FileProvider): Promise<Repository> {
		const gvc = new GitVersionControl(path, fp);
		if (!(await gvc.isInit())) return this._makeRepository(path, fp, null, null);
		const storage = await this._sp.getStorageByPath(path, fp, this._config);
		return this._makeRepository(path, fp, gvc, storage);
	}

	static null() {
		return NullRepository.instance;
	}

	async update(rep: Repository, fp: FileProvider, newPath: Path): Promise<void> {
		const gvc = new GitVersionControl(newPath, fp);
		const storage = await this._sp.getStorageByPath(newPath, fp, this._config);
		rep.update(newPath, gvc, storage, fp);
	}

	async initNew(path: Path, fp: FileProvider, data: StorageData): Promise<Repository> {
		const gvc = await GitVersionControl.init(fp, path, data.source);
		const storage = await this._sp.initNewStorage(fp, path, data, this._config);
		const repo = await this._makeRepository(path, fp, gvc, storage);
		await this._events.emit("connect-repository", { repo });
		return repo;
	}

	async cloneNewRepository(
		fs: FileStructure,
		path: Path,
		data: StorageData,
		recursive = true,
		isBare = false,
		branch?: string,
		onCloneFinish?: (path: Path, isCancelled: boolean) => Promise<void>,
	) {
		return this._sp.cloneNewStorage({ fs, path, data, recursive, isBare, branch, onCloneFinish });
	}

	async cancelClone(path: Path, fs: FileStructure) {
		return this._sp.cancelClone(path, fs);
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
		return new WorkdirRepository(path, fp, gvc, storage);
	}
}
