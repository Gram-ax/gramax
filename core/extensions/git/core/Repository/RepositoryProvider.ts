import { createEventEmitter, Event } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import type FileStructure from "@core/FileStructue/FileStructure";
import Cookie from "@ext/cookie/Cookie";
import { invalidateRepoCache } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import BareRepository from "@ext/git/core/Repository/BareRepository";
import NullRepository from "@ext/git/core/Repository/NullRepository";
import type Repository from "@ext/git/core/Repository/Repository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import UserInfo from "@ext/security/logic/User/UserInfo";
import SourceDataProvider from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Storage from "@ext/storage/logic/Storage";
import StorageProvider from "@ext/storage/logic/StorageProvider";
import StorageData from "@ext/storage/models/StorageData";

export type RepositoryProviderEvents = Event<"connect-repository", { repo: Repository }>;

export default class RepositoryProvider {
	private _sdp: SourceDataProvider;
	private _sp: StorageProvider;
	private _events = createEventEmitter<RepositoryProviderEvents>();

	constructor() {
		this._sp = new StorageProvider();
	}

	static invalidateRepoCache(paths: string[]) {
		return invalidateRepoCache({ repoPaths: paths });
	}

	get events() {
		return this._events;
	}

	addSourceDataProvider(sdp: SourceDataProvider) {
		this._sdp = sdp;
	}

	getSourceDatas(cookie: Cookie): SourceData[] {
		return this._sdp.getDatas(cookie);
	}

	removeSourceData(cookie: Cookie, storageName: string) {
		this._sdp.removeData(cookie, storageName);
	}

	getSourceData(cookie: Cookie, storageName: string): SourceData {
		const isExist = this._sdp.existData(cookie, storageName);
		if (!isExist) return null;
		return this._sdp.getData(cookie, storageName);
	}

	getSourceUserInfo(cookie: Cookie, storageName: string): UserInfo {
		const data = this.getSourceData(cookie, storageName);
		if (!data) return null;
		return { mail: data.userEmail, name: data.userName, id: data.userEmail };
	}

	setSourceData(cookie: Cookie, data: SourceData): string {
		return this._sdp.setData(cookie, data);
	}

	async getRepositoryByPath(path: Path, fp: FileProvider): Promise<Repository> {
		const gvc = new GitVersionControl(path, fp);
		if (!(await gvc.isInit())) return this._makeRepository(path, fp, null, null);
		const storage = await this._sp.getStorageByPath(path, fp);
		return this._makeRepository(path, fp, gvc, storage);
	}

	static null() {
		return NullRepository.instance;
	}

	async update(rep: Repository, fp: FileProvider, newPath: Path): Promise<void> {
		const gvc = new GitVersionControl(newPath, fp);
		const storage = await this._sp.getStorageByPath(newPath, fp);
		rep.update(newPath, gvc, storage, fp);
	}

	async initNew(path: Path, fp: FileProvider, data: StorageData): Promise<Repository> {
		const gvc = await GitVersionControl.init(fp, path, data.source);
		const storage = await this._sp.initNewStorage(fp, path, data);
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
		onCloneFinish?: (path: Path) => Promise<void>,
	) {
		return this._sp.cloneNewStorage({ fs, path, data, recursive, isBare, branch, onCloneFinish });
	}

	getCloneProgress(path: Path) {
		return this._sp.getCloneProgress(path);
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
