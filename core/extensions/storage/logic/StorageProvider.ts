import type FileStructure from "@core/FileStructue/FileStructure";
import ConfluenceStorage from "@ext/confluence/core/logic/ConfluenceStorage";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type { CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import Path from "../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../logic/FileProvider/model/FileProvider";
import GitStorage from "../../git/core/GitStorage/GitStorage";
import GitSourceData from "../../git/core/model/GitSourceData.schema";
import GitStorageData from "../../git/core/model/GitStorageData";
import StorageData from "../models/StorageData";
import SourceType from "./SourceDataProvider/model/SourceType";
import Storage from "./Storage";

interface CloneData {
	fs: FileStructure;
	path: Path;
	data: StorageData;
	recursive: boolean;
	branch: string;
	isBare: boolean;
	onCloneFinish: (path: Path) => Promise<void> | void;
}
export default class StorageProvider {
	private _promiseQueue = Promise.resolve();
	private _progressData: Map<string, CloneProgress>;

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

	async cloneNewStorage(cloneData: CloneData) {
		await this._queueCall(this._clone.bind(this), cloneData);
	}

	getCloneProgress(path: Path): CloneProgress {
		if (!this._progressData.has(path.toString())) return null;
		return this._progressData.get(path.toString());
	}

	private async _queueCall(func: (data: CloneData) => Promise<void>, data: CloneData) {
		this._progressData.set(data.path.toString(), { type: "wait", data: { path: data.path.toString() } });
		this._promiseQueue = this._promiseQueue.then(() => func(data));
		return this._promiseQueue;
	}

	private async _clone(cloneData: CloneData) {
		const { fs, path, data, recursive, branch, isBare, onCloneFinish } = cloneData;
		try {
			this._progressData.set(path.toString(), { type: "started", data: { path: path.toString() } });

			if (isGitSourceType(cloneData.data.source.sourceType)) {
				await GitStorage.clone({
					fs,
					branch,
					recursive,
					repositoryPath: path,
					data: data as GitStorageData,
					source: data.source as GitSourceData,
					isBare,
					onProgress: this._getOnProgress(path),
				});
			}

			if (
				data.source.sourceType === SourceType.confluenceCloud ||
				data.source.sourceType == SourceType.confluenceServer
			) {
				await ConfluenceStorage.clone({
					fs,
					data: data as ConfluenceStorageData,
					catalogPath: path,
				});
			}
			this._finishClone(path);
			await onCloneFinish?.(path);
		} catch (e) {
			if (e instanceof DefaultError) {
				this._errorClone(path, e);
			} else {
				const message = t("git.clone.error.generic");
				const title = t("git.clone.error.cannot-clone");
				this._errorClone(path, new DefaultError(message, e, { showCause: true }, null, title));
			}
		}
	}

	private _errorClone(path: Path, error: DefaultError) {
		this._progressData.set(path.toString(), { type: "error", data: { path: path.toString(), error } });
	}

	private _finishClone(path: Path) {
		this._progressData.set(path.toString(), { type: "finish", data: { path: path.toString() } });
	}

	private _getOnProgress(path: Path) {
		return ((p: CloneProgress) => {
			this._progressData.set(path.toString(), p);
		}).bind(this);
	}
}
