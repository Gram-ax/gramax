import { AppConfig } from "@app/config/AppConfig";
import type FileStructure from "@core/FileStructue/FileStructure";
import { XxHash } from "@core/Hash/Hasher";
import ConfluenceStorage from "@ext/confluence/core/logic/ConfluenceStorage";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import type { CloneCancelToken, CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import t from "@ext/localization/locale/translate";
import NotionStorage from "@ext/notion/logic/NotionStorage";
import NotionStorageData from "@ext/notion/model/NotionStorageData";
import isGitSourceType from "@ext/storage/logic/SourceDataProvider/logic/isGitSourceType";
import YandexDiskStorage from "@ext/yandexDisk/api/logic/YandexDiskStorage";
import YandexStorageData from "@ext/yandexDisk/model/YandexDiskStorageData";
import assert from "assert";
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
	onCloneFinish: (path: Path, isCancelled: boolean) => Promise<void> | void;
}

export default class StorageProvider {
	private _progressData: Map<string, CloneProgress> = new Map();
	private _cancelTokens: Map<string, CloneCancelToken> = new Map();

	constructor() {}

	async getStorageByPath(path: Path, fp: FileProvider, config: AppConfig): Promise<Storage> {
		if (await GitStorage.hasInit(fp, path)) return new GitStorage(path, fp, config?.services.auth.url);
		return null;
	}

	async initNewStorage(fp: FileProvider, path: Path, data: StorageData, config: AppConfig) {
		if (isGitSourceType(data.source.sourceType)) {
			await GitStorage.init(path, fp, data as GitStorageData);
		}
		return await this.getStorageByPath(path, fp, config);
	}

	async cloneNewStorage(cloneData: CloneData) {
		await this._clone(cloneData);
	}

	async cancelClone(path: Path, fs: FileStructure) {
		const absolutePath = fs.fp.default().rootPath.join(path);
		const cancelToken = this._cancelTokens.get(absolutePath.toString());
		assert(cancelToken, `clone (${path.value}) cancellation token not found`);
		return await GitStorage.cloneCancel(cancelToken, fs, path);
	}

	getCloneProgress(path: Path): CloneProgress {
		if (!this._progressData.has(path.toString())) return null;
		const data = this._progressData.get(path.toString());
		data.cancellable = this._cancelTokens.has(path.toString());
		return data;
	}

	private async _clone(cloneData: CloneData) {
		const { fs, path, data, recursive, branch, isBare, onCloneFinish } = cloneData;
		const rootPath = fs.fp.default().rootPath;
		const absolutePath = rootPath.join(cloneData.path);

		try {
			let isCancelled = false;
			this._progressData.set(absolutePath.toString(), { type: "started", data: { path: path.toString() } });

			if (isGitSourceType(cloneData.data.source.sourceType)) {
				const cancelToken = XxHash.hasher().hash(absolutePath).finalize();
				this._cancelTokens.set(absolutePath.toString(), cancelToken);

				try {
					await GitStorage.clone({
						fs,
						branch,
						recursive,
						repositoryPath: path,
						data: data as GitStorageData,
						source: data.source as GitSourceData,
						cancelToken,
						isBare,
						onProgress: this._getOnProgress(absolutePath),
					});
				} catch (e) {
					if (
						e.props?.errorCode === GitErrorCode.CancelledOperation ||
						e.cause?.props?.errorCode === GitErrorCode.CancelledOperation
					) {
						isCancelled = true;
					} else {
						throw e;
					}
				} finally {
					this._cancelTokens.delete(absolutePath.toString());
				}
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

			if (data.source.sourceType === SourceType.yandexDisk) {
				await YandexDiskStorage.clone({
					fs,
					data: data as YandexStorageData,
					catalogPath: path,
				});
			}

			if (data.source.sourceType === SourceType.notion) {
				await NotionStorage.clone({
					fs,
					data: data as NotionStorageData,
					catalogPath: path,
				});
			}

			await onCloneFinish?.(path, isCancelled);
			this._finishClone(rootPath, path, isCancelled);
		} catch (e) {
			if (await fs.fp.exists(path)) await fs.fp.delete(path);
			if (e instanceof DefaultError) {
				this._errorClone(rootPath, path, e);
			} else {
				const message = t("git.clone.error.generic");
				const title = t("git.clone.error.cannot-clone");
				this._errorClone(rootPath, path, new DefaultError(message, e, { showCause: true }, null, title));
			}
		}
	}

	private _errorClone(rootPath: Path, path: Path, error: DefaultError) {
		this._progressData.set(rootPath.join(path).toString(), {
			type: "error",
			data: { path: path.toString(), error },
		});
	}

	private _finishClone(rootPath: Path, path: Path, isCancelled: boolean) {
		this._progressData.set(rootPath.join(path).toString(), {
			type: "finish",
			data: { path: path.toString(), isCancelled },
		});
	}

	private _getOnProgress(absolutePath: Path) {
		return ((p: CloneProgress) => {
			p && this._progressData.set(absolutePath.toString(), p);
		}).bind(this);
	}
}
