import Path from "@core/FileProvider/Path/Path";
import FileProvider from "@core/FileProvider/model/FileProvider";
import Cookie from "@ext/cookie/Cookie";
import GitCommandsConfig from "@ext/git/core/GitCommands/model/GitCommandsConfig";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import Repository from "@ext/git/core/Repository/Repository";
import UserInfo from "@ext/security/logic/User/UserInfo2";
import SourceDataProvider from "@ext/storage/logic/SourceDataProvider/logic/SourceDataProvider";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import StorageProvider from "@ext/storage/logic/StorageProvider";
import StorageData from "@ext/storage/models/StorageData";

export default class RepositoryProvider {
	private _sdp: SourceDataProvider;
	private _sp: StorageProvider;

	constructor(private _conf: GitCommandsConfig) {
		this._sdp = new SourceDataProvider();
		this._sp = new StorageProvider(_conf);
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
		if (!(await GitVersionControl.hasInit(this._conf, fp, path))) return new Repository(path, fp, null, null);
		const gvc = new GitVersionControl(this._conf, path, fp);
		const storage = await this._sp.getStorageByPath(path, fp);
		return new Repository(path, fp, gvc, storage);
	}

	async initNewRepository(path: Path, fp: FileProvider, data: StorageData): Promise<Repository> {
		const gvc = await GitVersionControl.init(this._conf, fp, path, data.source);
		const storage = await this._sp.initNewStorage(fp, path, data);
		return new Repository(path, fp, gvc, storage);
	}

	cloneNewRepository(fp: FileProvider, path: Path, data: StorageData, recursive = true, branch?: string) {
		return this._sp.cloneNewStorage(fp, path, data, recursive, branch);
	}

	getCloneProgress(path: Path) {
		return this._sp.getCloneProgress(path);
	}
}
