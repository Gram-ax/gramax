import GitCommandsConfig from "@ext/git/core/GitCommands/model/GitCommandsConfig";
import Path from "../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import GitStorage from "../../git/core/GitStorage/GitStorage";
import GitSourceData from "../../git/core/model/GitSourceData.schema";
import GitStorageData from "../../git/core/model/GitStorageData";
import Progress from "../models/Progress";
import StorageData from "../models/StorageData";
import SourceType from "./SourceDataProvider/model/SourceType";
import Storage from "./Storage";

export default class StorageProvider {
	private _progressData: Map<string, Progress>;

	constructor(private _conf: GitCommandsConfig) {
		this._progressData = new Map();
	}

	async getStorageByPath(path: Path, fp: FileProvider): Promise<Storage> {
		if (await GitStorage.hasInit(this._conf, fp, path)) return new GitStorage(this._conf, path, fp);
		return null;
	}

	async initNewStorage(fp: FileProvider, path: Path, data: StorageData) {
		if (this._isCorrectStorageType(data.source.sourceType)) {
			await GitStorage.init(this._conf, path, fp, data as GitStorageData);
		}
		return await this.getStorageByPath(path, fp);
	}

	async cloneNewStorage(fp: FileProvider, path: Path, data: StorageData, recursive = true, branch?: string) {
		if (this._isCorrectStorageType(data.source.sourceType)) {
			await GitStorage.clone({
				fp,
				branch,
				recursive,
				repositoryPath: path,
				conf: this._conf,
				data: data as GitStorageData,
				source: data.source as GitSourceData,
				onProgress: this._getOnProgress(path),
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

	private _isCorrectStorageType(storageType: SourceType): boolean {
		return (
			storageType === SourceType.gitLab ||
			storageType === SourceType.gitHub ||
			storageType === SourceType.enterprise
		);
	}
}
