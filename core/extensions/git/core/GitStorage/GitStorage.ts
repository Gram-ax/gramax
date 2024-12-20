import { getHttpsRepositoryUrl } from "@components/libs/utils";
import GithubStorageData from "@ext/git/actions/Source/GitHub/model/GithubStorageData";
import getUrlFromGitStorageData from "@ext/git/core/GitStorage/utils/getUrlFromGitStorageData";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import parseStorageUrl, { type StorageUrl } from "../../../../logic/utils/parseStorageUrl";
import Branch from "../../../VersionControl/model/branch/Branch";
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
	private _parsedUrl: StorageUrl;
	private static _gitDataParser: GitDataParser = gitDataParser;

	constructor(private _path: Path, private _fp: FileProvider) {
		this._gitRepository = new GitCommands(this._fp, this._path);
		void this._initSubGitStorages();
	}

	static async hasInit(fp: FileProvider, path: Path): Promise<boolean> {
		const git = new GitCommands(fp, path);
		return (await git.isInit()) && (await git.hasRemote());
	}

	static async clone({
		fs,
		url,
		data,
		source,
		branch,
		recursive = true,
		isBare = false,
		onProgress,
		repositoryPath,
	}: GitCloneData) {
		fs.fp.stopWatch();
		try {
			const gitRepository = new GitCommands(fs.fp.default(), repositoryPath);
			const currentUrl = url ?? getUrlFromGitStorageData(data);
			try {
				await gitRepository.clone(getHttpsRepositoryUrl(currentUrl), source, branch, null, isBare, onProgress);
			} catch (e) {
				if (!((e as GitError).props?.errorCode === GitErrorCode.AlreadyExistsError)) throw e;
			}
			if (recursive) {
				// const submodulesData = await gitRepository.getSubmodulesData();
				// await Promise.all(
				// 	submodulesData.map(async (d) => {
				// 		const submodulePath = repositoryPath.join(d.path);
				// 		await GitStorage.clone({
				// 			fp,
				// 			source,
				// 			url: d.url,
				// 			branch: d.branch,
				// 			repositoryPath: submodulePath,
				// 			recursive: true,
				// 			onProgress,
				// 		});
				// 	}),
				// );
			}
		} finally {
			fs.fp?.startWatch();
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
		const parsedUrl = await this.getParsedUrl();
		return parsedUrl.name;
	}

	async getGroup() {
		const parsedUrl = await this.getParsedUrl();
		return parsedUrl.group;
	}

	async getSourceName() {
		const parsedUrl = await this.getParsedUrl();
		return parsedUrl.domain;
	}

	private async getParsedUrl() {
		if (!this._parsedUrl) this._parsedUrl = parseStorageUrl(await this.getUrl());
		return this._parsedUrl;
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
			// const subModules = await this.getSubGitStorages();
			// for (const s of subModules) await s.push(data);
		}
		await this.updateSyncCount();
	}

	async getSyncCount() {
		if (!this._syncCount) await this.updateSyncCount();
		return this._syncCount;
	}

	async updateSyncCount() {
		try{
			this._syncCount = await this._gitRepository.graphHeadUpstreamFilesCount(this._syncSearchInPath);
		} catch (e) {
			this._syncCount = { pull: 0, push: 0, hasChanges: false };
			console.error(e);
		}
	}

	getRemoteName(): Promise<string> {
		return this._gitRepository.getRemoteName();
	}

	async pull(data: GitSourceData, recursive = true) {
		this._fp.stopWatch();
		try {
			const remoteName = (await this._gitRepository.getCurrentBranch()).getData().remoteName;
			if (remoteName) await this._gitRepository.pull(data);

			if (recursive) {
				await this._initSubGitStorages();
				for (const storage of await this.getSubGitStorages()) {
					await storage.pull(data);
				}
			}
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
		const submodules = await this.getSubGitStorages();
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

	async fetch(data: GitSourceData, force = false) {
		await this._gitRepository.fetch(data, force);
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

	async getSubGitStorages(): Promise<GitStorage[]> {
		if (!this._subGitStorages) await this._initSubGitStorages();
		return this._subGitStorages;
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

	private async _getSubmodulesData() {
		if (!this._submodulesData) await this._initSubmodulesData();
		return this._submodulesData;
	}

	private async _initSubGitStorages(): Promise<void> {
		const getSubmodulesData = await this._getSubmodulesData();
		this._subGitStorages = await Promise.all(
			getSubmodulesData.map(async (data) => {
				const fullSubmodulePath = this._path.join(data.path);
				if (await this._gitRepository.isSubmoduleExist(data.path))
					return new GitStorage(fullSubmodulePath, this._fp);
			}),
		).then((x) => x.filter((x) => x));
	}

	private async _initSubmodulesData() {
		this._submodulesData = await this._gitRepository.getSubmodulesData();
	}
}
