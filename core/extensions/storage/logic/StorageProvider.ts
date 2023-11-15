import GitRepositoryConfig from "@ext/git/core/GitRepository/model/GitRepositoryConfig";
import Path from "../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import Cookie from "../../cookie/Cookie";
import GitStorage from "../../git/core/GitStorage/GitStorage";
import GitSourceData from "../../git/core/model/GitSourceData.schema";
import GitStorageData from "../../git/core/model/GitStorageData";
import UserInfo from "../../security/logic/User/UserInfo2";
import Progress from "../models/Progress";
import StorageData from "../models/StorageData";
import SourceDataProvider from "./SourceDataProvider/logic/SourceDataProvider";
import SourceData from "./SourceDataProvider/model/SourceData";
import SourceType from "./SourceDataProvider/model/SourceType";
import Storage from "./Storage";
import StorageСhecker from "./StorageСhecker";

export default class StorageProvider {
	private _sdp: SourceDataProvider;
	private _progressData: Map<string, Progress>;
	constructor(private _conf: GitRepositoryConfig) {
		this._sdp = new SourceDataProvider();
		this._progressData = new Map();
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

	async getStorageByPath(path: Path, fp: FileProvider): Promise<Storage> {
		if (await GitStorage.hasInit(this._conf, fp, path)) return new GitStorage(this._conf, path, fp);
		return null;
	}

	async initNewStorage(fp: FileProvider, path: Path, data: StorageData) {
		if (this._isCorrentStorageType(data.source.sourceType)) {
			await GitStorage.init(this._conf, path, fp, data as GitStorageData);
		}
		return await this.getStorageByPath(path, fp);
	}

	async cloneNewStorage(
		fp: FileProvider,
		sc: StorageСhecker,
		path: Path,
		data: StorageData,
		recursive = true,
		branch?: string,
	) {
		if (this._isCorrentStorageType(data.source.sourceType)) {
			await GitStorage.clone({
				fp,
				recursive,
				repositoryPath: path,
				conf: this._conf,
				data: data as GitStorageData,
				source: data.source as GitSourceData,
				onProgress: this._getOnProgress(path),
				branch: branch ?? (await sc.getСorrectBranch(data as GitStorageData)),
			});
		}
	}

	getCloneProgress(path: Path): Progress {
		if (!this._progressData.has(path.toString())) return null;
		return this._progressData.get(path.toString());
	}

	private _getOnProgress(path: Path) {
		return ((p: Progress) => {
			this._progressData.set(path.toString(), { ...p, percent: Math.ceil((p.loaded / p.total) * 100) });
		}).bind(this);
	}

	private _isCorrentStorageType(storageType: SourceType): boolean {
		return (
			storageType === SourceType.gitLab ||
			storageType === SourceType.gitHub ||
			storageType === SourceType.enterprise
		);
	}
}
