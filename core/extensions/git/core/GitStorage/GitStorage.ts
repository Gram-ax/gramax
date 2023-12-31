import { getHttpsRepositoryUrl } from "@components/libs/utils";
import GitRepositoryConfig from "@ext/git/core/GitRepository/model/GitRepositoryConfig";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import parseStorageUrl from "../../../../logic/utils/parseStorageUrl";
import Branch from "../../../VersionControl/model/branch/Branch";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";
import Storage from "../../../storage/logic/Storage";
import getPartSourceDataByStorageName from "../../../storage/logic/utils/getPartSourceDataByStorageName";
import getSourceNameByData from "../../../storage/logic/utils/getSourceNameByData";
import createGitHubRepository from "../../actions/Storage/GitHub/logic/createGitHubRepository";
import gitDataParser, { GitDataParser } from "../GitDataParser/GitDataParser";
import GitRepository from "../GitRepository/GitRepository";
import GitError from "../GitRepository/errors/GitError";
import GitErrorCode from "../GitRepository/errors/model/GitErrorCode";
import GitShareLinkData from "../model/GitShareLinkData";
import GitSourceData from "../model/GitSourceData.schema";
import GitStorageData from "../model/GitStorageData";
import GitStorageUrl from "../model/GitStorageUrl";
import SubmoduleData from "../model/SubmoduleData";
import GitCloneData from "./GitCloneData";

export default class GitStorage implements Storage {
	private _subGitStorages: GitStorage[];
	private _url: GitStorageUrl;
	private _submodulesData: SubmoduleData[];
	private _gitRepository: GitRepository;
	private static _gitDataParser: GitDataParser = gitDataParser;

	constructor(private _conf: GitRepositoryConfig, private _path: Path, private _fp: FileProvider) {
		this._gitRepository = new GitRepository(_conf, this._fp, this._path);
		void this._initSubGitStorages();
	}

	static hasInit(conf: GitRepositoryConfig, fp: FileProvider, path: Path): Promise<boolean> {
		return new GitRepository(conf, fp, path).hasRemote();
	}

	static async clone({
		fp,
		url,
		data,
		source,
		branch,
		recursive = true,
		onProgress,
		repositoryPath,
		conf,
	}: GitCloneData) {
		fp.stopWatch();

		const gitRepository = new GitRepository(conf, fp, repositoryPath);
		const currentUrl = url ?? `https://${data.source.domain}/${data.group}/${data.name}`;
		try {
			await gitRepository.clone(getHttpsRepositoryUrl(currentUrl), source, branch, onProgress);
		} catch (e) {
			if (!((e as GitError).props?.errorCode === GitErrorCode.AlreadyExistsError)) throw e;
		}
		if (recursive) {
			const submodulesData = await gitRepository.getSubmodulesData();
			for (const d of submodulesData) {
				const submodulePath = repositoryPath.join(d.path);
				await GitStorage.clone({
					fp,
					source,
					conf,
					url: d.url,
					branch: d.branch,
					repositoryPath: submodulePath,
					recursive,
					onProgress,
				});
			}
		}

		fp.startWatch();
	}

	static async init(conf: GitRepositoryConfig, repositoryPath: Path, fp: FileProvider, data: GitStorageData) {
		if (data.source.sourceType == SourceType.gitHub) await createGitHubRepository(data);
		const gitRepository = new GitRepository(conf, fp, repositoryPath);
		await gitRepository.addRemote(data);
	}

	getPath(): Path {
		return this._path;
	}

	async getName(): Promise<string> {
		return parseStorageUrl(await this.getUrl()).name;
	}

	async getGroup() {
		return parseStorageUrl(await this.getUrl()).group;
	}

	async getType() {
		return getPartSourceDataByStorageName(await this.getSourceName()).sourceType;
	}

	async getReviewData(source: GitSourceData, branch: string, filePath: Path): Promise<GitShareLinkData> {
		return {
			name: await this.getName(),
			group: await this.getGroup(),
			domain: source.domain,
			branch,
			sourceType: source.sourceType,
			filePath: filePath.value,
		};
	}

	async getSourceName() {
		return parseStorageUrl(await this.getUrl()).domain;
	}
	async getData(source: GitSourceData): Promise<GitStorageData> {
		return {
			group: await this.getGroup(),
			name: await this.getName(),
			source,
		};
	}

	async getUrl(): Promise<GitStorageUrl> {
		if (!this._url) await this._initRepositoryUrl();
		return this._url;
	}

	async push(data: GitSourceData, recursive = true) {
		if (getSourceNameByData(data) !== (await this.getSourceName())) return;
		await this._gitRepository.push(data);
		const subModules = await this._getSubGitStorages();
		if (recursive) {
			for (const s of subModules) await s.push(data);
		}
	}

	async pull(data: GitSourceData, recursive = true) {
		const oldSubmodulDatas = await this._getSubmodulesData();
		this._fp.stopWatch();
		try {
			const remoteName = (await this._gitRepository.getCurrentBranch()).getData().remoteName;
			if (remoteName) await this._gitRepository.pull(data);
		} finally {
			await this.update();
		}
		if (recursive) {
			const newSubmodulDatas = await this._getSubmodulesData();
			await this._updateSubmodules(oldSubmodulDatas, newSubmodulDatas, data);
		}
		this._fp.startWatch();
	}

	async getFileLink(path: Path, branch?: Branch): Promise<string> {
		const { storage, relativePath } = await this.getStorageContainsItem(path);
		const splitRepositoryUrl = getHttpsRepositoryUrl(await storage.getUrl()).split("/");
		return GitStorage._gitDataParser.getGitLabLink(
			splitRepositoryUrl,
			branch ? await this._gitRepository.getRemoteBranchName(branch.toString()) : "master",
			await storage.getName(),
			relativePath,
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
	}

	async update() {
		await this._initSubGitStorages();
		await this._initRepositoryUrl();
		await this._initSubmodulesData();
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
						conf: this._conf,
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
							conf: this._conf,
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
							conf: this._conf,
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
				const subGitStorage = new GitStorage(this._conf, path, this._fp);
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
			conf: this._conf,
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
