import { getHttpsRepositoryUrl } from "@components/libs/utils";
import GithubStorageData from "@ext/git/actions/Source/GitHub/model/GithubStorageData";
import getUrlFromGitStorageData from "@ext/git/core/GitStorage/utils/getUrlFromGitStorageData";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import parseStorageUrl from "../../../../logic/utils/parseStorageUrl";
import Branch from "../../../VersionControl/model/branch/Branch";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";
import Storage from "../../../storage/logic/Storage";
import getPartGitSourceDataByStorageName from "../../../storage/logic/utils/getPartSourceDataByStorageName";
import getStorageNameByData from "../../../storage/logic/utils/getStorageNameByData";
import createGitHubRepository from "../../actions/Source/GitHub/logic/createGitHubRepository";
import GitCommands from "../GitCommands/GitCommands";
import GitError from "../GitCommands/errors/GitError";
import GitErrorCode from "../GitCommands/errors/model/GitErrorCode";
import gitDataParser, { GitDataParser } from "../GitDataParser/GitDataParser";
import GitShareData from "../model/GitShareData";
import GitSourceData from "../model/GitSourceData.schema";
import GitStorageData from "../model/GitStorageData";
import GitStorageUrl from "../model/GitStorageUrl";
import SubmoduleData from "../model/SubmoduleData";
import GitCloneData from "./GitCloneData";

export default class GitStorage implements Storage {
	private _subGitStorages: GitStorage[];
	private _url: GitStorageUrl;
	private _submodulesData: SubmoduleData[];
	private _gitRepository: GitCommands;
	private _syncCount: { pull: number; push: number; hasChanges: boolean };
	private _syncSearchInPath = "";
	private static _gitDataParser: GitDataParser = gitDataParser;

	constructor(private _path: Path, private _fp: FileProvider) {
		this._gitRepository = new GitCommands(this._fp, this._path);
		void this._initSubGitStorages();
	}

	static hasInit(fp: FileProvider, path: Path): Promise<boolean> {
		return new GitCommands(fp, path).hasRemote();
	}

	static async clone({ fp, url, data, source, branch, recursive = true, onProgress, repositoryPath }: GitCloneData) {
		fp.stopWatch();
		try {
			const gitRepository = new GitCommands(fp, repositoryPath);
			const currentUrl = url ?? getUrlFromGitStorageData(data);
			try {
				await gitRepository.clone(getHttpsRepositoryUrl(currentUrl), source, branch, onProgress);
			} catch (e) {
				if (!((e as GitError).props?.errorCode === GitErrorCode.AlreadyExistsError)) throw e;
			}
			if (recursive) {
				const submodulesData = await gitRepository.getSubmodulesData();
				await Promise.all(
					submodulesData.map(async (d) => {
						const submodulePath = repositoryPath.join(d.path);
						await GitStorage.clone({
							fp,
							source,
							url: d.url,
							branch: d.branch,
							repositoryPath: submodulePath,
							recursive: true,
							onProgress,
						});
					}),
				);
			}
		} finally {
			fp?.startWatch();
		}
	}

	static async init(repositoryPath: Path, fp: FileProvider, data: GitStorageData) {
		if (data.source.sourceType == SourceType.gitHub) await createGitHubRepository(data as GithubStorageData);
		const gitRepository = new GitCommands(fp, repositoryPath);
		await gitRepository.addRemote(data);
	}

	getPath(): Path {
		return this._path;
	}

	setSyncSearchInPath(path: string) {
		this._syncSearchInPath = path;
	}

	async getName(): Promise<string> {
		return parseStorageUrl(await this.getUrl()).name;
	}

	async getGroup() {
		return parseStorageUrl(await this.getUrl()).group;
	}

	async getSourceName() {
		return parseStorageUrl(await this.getUrl()).domain;
	}

	async getType() {
		return getPartGitSourceDataByStorageName(await this.getSourceName()).sourceType;
	}

	async getStorageData(source: GitSourceData): Promise<GitStorageData> {
		return {
			group: await this.getGroup(),
			name: await this.getName(),
			source,
		};
	}

	async getShareData(source: GitSourceData, branch: string, filePath: Path): Promise<GitShareData> {
		return {
			name: await this.getName(),
			group: await this.getGroup(),
			branch,
			domain: source.domain,
			protocol: source.protocol,
			sourceType: source.sourceType,
			filePath: filePath.value,
		};
	}

	async getUrl(): Promise<GitStorageUrl> {
		if (!this._url) await this._initRepositoryUrl();
		return this._url;
	}

	async push(data: GitSourceData, recursive = true) {
		if (getStorageNameByData(data) !== (await this.getSourceName())) return;
		await this._gitRepository.push(data);
		if (recursive) {
			const subModules = await this._getSubGitStorages();
			for (const s of subModules) await s.push(data);
		}
		await this.updateSyncCount();
	}

	async getSyncCount() {
		if (!this._syncCount) await this.updateSyncCount();
		return this._syncCount;
	}

	async updateSyncCount() {
		this._syncCount = await this._gitRepository.graphHeadUpstreamFilesCount(this._syncSearchInPath);
	}

	getRemoteName(): Promise<string> {
		return this._gitRepository.getRemoteName();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async pull(data: GitSourceData, recursive = true) {
		// const oldSubmodulDatas = await this._getSubmodulesData();
		this._fp.stopWatch();
		try {
			const remoteName = (await this._gitRepository.getCurrentBranch()).getData().remoteName;
			if (remoteName) await this._gitRepository.pull(data);

			// if (recursive) {
			// 	const newSubmodulDatas = await this._getSubmodulesData();
			// 	await this._updateSubmodules(oldSubmodulDatas, newSubmodulDatas, data);
			// }
		} finally {
			await this.update();
			this._fp?.startWatch();
		}
	}

	async getFileLink(path: Path, branch?: Branch): Promise<string> {
		return GitStorage._gitDataParser.getEditFileLink(
			await this.getSourceName(),
			await this.getGroup(),
			await this.getName(),
			branch ? await this._gitRepository.getRemoteBranchName(branch.toString()) : "master",
			path,
			await this.getType(),
		);
	}

	async getStorageContainsItem(path: Path): Promise<{ storage: GitStorage; relativePath: Path }> {
		const submodules = await this._getSubGitStorages();
		for (const submodule of submodules) {
			const relativeSubmodulePath = await this._getRelativeSubmodulePath(submodule.getPath());
			if (path.startsWith(relativeSubmodulePath)) {
				return await submodule.getStorageContainsItem(
					relativeSubmodulePath.subDirectory(path).removeExtraSymbols,
				);
			}
		}
		return { storage: this, relativePath: path };
	}

	async fetch(data: GitSourceData) {
		await this._gitRepository.fetch(data);
		await this.updateSyncCount();
	}

	async update() {
		await this._initSubGitStorages();
		await this._initRepositoryUrl();
		await this._initSubmodulesData();
		await this.updateSyncCount();
	}

	deleteRemoteBranch(branch: string, data: GitSourceData): Promise<void> {
		return this._gitRepository.deleteBranch(branch, true, data);
	}

	private async _updateSubmodules(
		oldSubmoduleDatas: SubmoduleData[],
		newSubmoduleDatas: SubmoduleData[],
		source: GitSourceData,
	): Promise<void> {
		const submoduleData = this._getSubmoduleDatasForSubmodulePath(oldSubmoduleDatas, newSubmoduleDatas);
		for (const [path, datas] of submoduleData.entries()) {
			const submodulePath = this._getFullSubmodulePath(new Path(path));
			const subGitStorage = (await this._getSubGitStorages()).find((x) => x.getPath().compare(submodulePath));
			const action = this._getSubmoduleAction(datas.old, datas.new);
			switch (action) {
				case FileStatus.new:
					await GitStorage.clone({
						source,
						fp: this._fp,
						url: datas.new.url,
						branch: datas.new.branch,
						repositoryPath: submodulePath,
					});
					break;
				case FileStatus.delete:
					await this._fp.delete(submodulePath);
					break;
				case FileStatus.modified:
					if (!subGitStorage) {
						await GitStorage.clone({
							source,
							fp: this._fp,
							url: datas.new.url,
							branch: datas.new.branch,
							repositoryPath: submodulePath,
						});
						break;
					}
					if (await this._tryReCloneSubmodule(submodulePath, datas.old, datas.new, source)) break;
					await this._checkoutSubmodule(subGitStorage, datas.old, datas.new);
					await subGitStorage.pull(source);
					break;
				case FileStatus.current:
					if (!subGitStorage) {
						await GitStorage.clone({
							source,
							fp: this._fp,
							url: datas.new.url,
							branch: datas.new.branch,
							repositoryPath: submodulePath,
						});
						break;
					}
					await subGitStorage.pull(source);
					break;
			}
		}
	}

	private async _initRepositoryUrl() {
		if (!(await this._gitRepository.hasRemote())) return;
		this._url = await this._gitRepository.getRemoteUrl();
	}

	private async _getRelativeSubmodulePath(submodulePath: Path): Promise<Path> {
		for (const data of await this._getSubmodulesData()) {
			if (submodulePath.endsWith(data.path)) return data.path;
		}
	}

	private _getFullSubmodulePath(submodulePath: Path): Path {
		return this.getPath().join(submodulePath);
	}

	private async _getSubmodulesData() {
		if (!this._submodulesData) await this._initSubmodulesData();
		return this._submodulesData;
	}

	private async _getSubGitStorages(): Promise<GitStorage[]> {
		if (!this._subGitStorages) await this._initSubGitStorages();
		return this._subGitStorages;
	}

	private async _initSubGitStorages(): Promise<void> {
		this._subGitStorages = await this._getFixedSubGitStorages();
	}

	private async _getFixedSubGitStorages(): Promise<GitStorage[]> {
		try {
			return (await this._gitRepository.getFixedSubmodulePaths()).map((path) => {
				const subGitStorage = new GitStorage(path, this._fp);
				return subGitStorage;
			});
		} catch {
			return [];
		}
	}

	private async _initSubmodulesData() {
		this._submodulesData = await this._gitRepository.getSubmodulesData();
	}

	private async _tryReCloneSubmodule(
		submodulePath: Path,
		oldData: SubmoduleData,
		newData: SubmoduleData,
		source: GitSourceData,
	): Promise<boolean> {
		if (oldData.url === newData.url) return false;
		await this._fp.delete(submodulePath);
		await GitStorage.clone({
			source,
			fp: this._fp,
			url: newData.url,
			branch: newData.branch,
			repositoryPath: submodulePath,
		});
		return true;
	}

	private async _checkoutSubmodule(
		subGitStorage: GitStorage,
		oldData: SubmoduleData,
		newData: SubmoduleData,
	): Promise<boolean> {
		if (oldData.branch === newData.branch) return false;
		await subGitStorage._gitRepository.checkout(newData.branch);
		return true;
	}

	private _getSubmoduleAction(oldData: SubmoduleData, newData: SubmoduleData): FileStatus {
		const equal = (data1: SubmoduleData, data2: SubmoduleData) =>
			data1.path.compare(data2.path) && data1.branch === data2.branch && data1.url === data2.url;

		if (!oldData) return FileStatus.new;
		else if (!newData) return FileStatus.delete;
		else if (equal(oldData, newData)) return FileStatus.current;
		return FileStatus.modified;
	}

	private _getSubmoduleDatasForSubmodulePath(
		oldSubmodulDatas: SubmoduleData[],
		newSubmodulDatas: SubmoduleData[],
	): Map<string, { old: SubmoduleData; new: SubmoduleData }> {
		const result = new Map<string, { old: SubmoduleData; new: SubmoduleData }>();

		oldSubmodulDatas.forEach((data) => {
			result.set(data.path.removeExtraSymbols.value, { old: data, new: null });
		});
		newSubmodulDatas.forEach((data) => {
			const path = data.path.removeExtraSymbols.value;
			if (result.has(path)) {
				result.set(path, { old: result.get(path).old, new: data });
			} else {
				result.set(path, { old: null, new: data });
			}
		});

		return result;
	}
}
