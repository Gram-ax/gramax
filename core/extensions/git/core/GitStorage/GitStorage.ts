import { getHttpsRepositoryUrl } from "@components/libs/utils";
import { createEventEmitter } from "@core/Event/EventEmitter";
import type FileStructure from "@core/FileStructue/FileStructure";
import GithubStorageData from "@ext/git/actions/Source/GitHub/model/GithubStorageData";
import type { CloneCancelToken } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import getUrlFromGitStorageData from "@ext/git/core/GitStorage/utils/getUrlFromGitStorageData";
import type { ProxiedSourceDataCtx } from "@ext/storage/logic/SourceDataProvider/logic/SourceDataCtx";
import assert from "assert";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import parseStorageUrl, { type StorageUrl } from "../../../../logic/utils/parseStorageUrl";
import Branch from "../../../VersionControl/model/branch/Branch";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";
import Storage, { StorageEvents } from "../../../storage/logic/Storage";
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
	private _cachedDefaultBranch: Branch;
	private static _gitDataParser: GitDataParser = gitDataParser;
	private _events = createEventEmitter<StorageEvents>();

	constructor(private _path: Path, private _fp: FileProvider, private _authServiceUrl?: string) {
		this._gitRepository = new GitCommands(this._fp, this._path);
		this._gitRepository.events.on("fetch", ({ force }) => this._events.emit("fetch", { storage: this, force }));
		void this._initSubGitStorages();
	}

	static async hasInit(fp: FileProvider, path: Path): Promise<boolean> {
		const git = new GitCommands(fp, path);
		return (await git.isInit()) && (await git.hasRemote());
	}

	static async cloneCancel(cancelToken: CloneCancelToken, fs: FileStructure, repoPath: Path) {
		const gitRepository = new GitCommands(fs.fp.default(), repoPath);
		await gitRepository.cloneCancel(cancelToken);
	}

	static async getAllCancelTokens(fp: FileProvider, path: Path) {
		const git = new GitCommands(fp, path);
		return git.getAllCancelTokens();
	}

	static async clone({
		fs,
		data,
		source,
		branch,
		cancelToken,
		recursive = true,
		isBare = false,
		onProgress,
		repositoryPath,
	}: GitCloneData) {
		fs.fp.stopWatch();
		try {
			const gitRepository = new GitCommands(fs.fp.default(), repositoryPath);
			const currentUrl = getUrlFromGitStorageData(data);
			try {
				await gitRepository.clone(
					getHttpsRepositoryUrl(currentUrl),
					source,
					cancelToken,
					branch,
					null,
					isBare,
					onProgress,
				);
			} catch (e) {
				if ((e as GitError).props?.errorCode === GitErrorCode.AlreadyExistsError) return;
				if (((e as GitError).cause as any)?.props?.errorCode === GitErrorCode.CancelledOperation) throw e;

				await (source as ProxiedSourceDataCtx<GitSourceData>).assertValid?.(e);
				throw e;
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

	get events() {
		return this._events;
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

	async getDefaultBranch(source: GitSourceData): Promise<Branch | null> {
		if (!this._cachedDefaultBranch) this._cachedDefaultBranch = await this._gitRepository.getDefaultBranch(source);
		return this._cachedDefaultBranch;
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
			filePath: filePath.value.split("/").filter(Boolean),
			isPublic: false,
		};
	}

	async getUrl(): Promise<GitStorageUrl> {
		if (!this._url) await this._initRepositoryUrl();
		return this._url;
	}

	async push(source: GitSourceData) {
		await this.validateStorageName(source);

		try {
			await this._gitRepository.push(source);
		} catch (e) {
			await (source as ProxiedSourceDataCtx<GitSourceData>).assertValid?.(e);
			throw e;
		}

		await this.updateSyncCount();
	}

	async getSyncCount() {
		if (!this._syncCount) await this.updateSyncCount();
		return this._syncCount;
	}

	async updateSyncCount() {
		try {
			this._syncCount = await this._gitRepository.graphHeadUpstreamFilesCount(this._syncSearchInPath);
		} catch (e) {
			this._syncCount = { pull: 0, push: 0, hasChanges: false };
			console.error(e);
		}
	}

	getRemoteName(): Promise<string> {
		return this._gitRepository.getRemoteName();
	}

	async pull(source: GitSourceData, recursive = true) {
		this._fp.stopWatch();

		try {
			const remoteName = (await this._gitRepository.getCurrentBranch()).getData().remoteName;
			if (remoteName) {
				try {
					await this._gitRepository.pull(source);
				} catch (e) {
					await (source as ProxiedSourceDataCtx<GitSourceData>).assertValid?.(e);
					throw e;
				}
			}

			if (recursive) {
				await this._initSubGitStorages();
				for (const storage of await this.getSubGitStorages()) {
					try {
						await storage.pull(source);
					} catch (e) {
						await (source as ProxiedSourceDataCtx<GitSourceData>).assertValid?.(e);
						throw e;
					}
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

	async fetch(source: GitSourceData, force = false) {
		try {
			await this._gitRepository.fetch(source, force);
		} catch (e) {
			await (source as ProxiedSourceDataCtx<GitSourceData>).assertValid?.(e);
			throw e;
		}
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

	async validateStorageName(source: GitSourceData) {
		const storageName = getStorageNameByData(source);
		assert(
			storageName === (await this.getSourceName()),
			`storage name mismatch: ${storageName} !== ${await this.getSourceName()}; can't push to this storage`,
		);
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
					return new GitStorage(fullSubmodulePath, this._fp, this._authServiceUrl);
			}),
		).then((x) => x.filter((x) => x));
	}

	private async _initSubmodulesData() {
		this._submodulesData = await this._gitRepository.getSubmodulesData();
	}
}
