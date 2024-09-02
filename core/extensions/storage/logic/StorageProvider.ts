import ConfluenceStorage from "@ext/confluence/core/logic/ConfluenceStorage";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
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

	constructor() {
		this._progressData = new Map();
	}

	async getStorageByPath(path: Path, fp: FileProvider): Promise<Storage> {
		if (await GitStorage.hasInit(fp, path)) return new GitStorage(path, fp);
		return null;
	}

	async initNewStorage(fp: FileProvider, path: Path, data: StorageData) {
		if (isGitSourceType(data.source.sourceType)) {
			await GitStorage.init(path, fp, data as GitStorageData);
		}
		return await this.getStorageByPath(path, fp);
	}

	async cloneNewStorage(fp: FileProvider, path: Path, data: StorageData, recursive = true, branch?: string) {
		if (isGitSourceType(data.source.sourceType)) {
			await GitStorage.clone({
				fp,
				branch,
				recursive,
				repositoryPath: path,
				data: data as GitStorageData,
				source: data.source as GitSourceData,
				onProgress: this._getOnProgress(path),
			});
		}

		if (data.source.sourceType == SourceType.confluence) {
			await ConfluenceStorage.clone({
				fp,
				data: data as ConfluenceStorageData,
				catalogPath: path,
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
}
