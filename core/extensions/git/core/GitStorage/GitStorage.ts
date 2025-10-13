import { getHttpsRepositoryUrl } from "@components/libs/utils";
import { createEventEmitter } from "@core/Event/EventEmitter";
import type FileStructure from "@core/FileStructue/FileStructure";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import type { CancelToken } from "@ext/git/core/GitCommands/model/GitCommandsModel";
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
import GitCommands from "../GitCommands/GitCommands";
import GitError from "../GitCommands/errors/GitError";
import GitErrorCode from "../GitCommands/errors/model/GitErrorCode";
import gitDataParser, { GitDataParser } from "../GitDataParser/GitDataParser";
import GitShareData from "../model/GitShareData";
import GitSourceData from "../model/GitSourceData.schema";
import GitStorageData from "../model/GitStorageData";
import GitStorageUrl from "../model/GitStorageUrl";
import GitCloneData from "./GitCloneData";

export default class GitStorage implements Storage {
	private _url: GitStorageUrl;
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
	}

	static async isInit(fp: FileProvider, path: Path): Promise<boolean> {
		const git = new GitCommands(fp, path);
		const isInit = await git.isInit();
		const hasRemote = await git.hasRemote();
		return isInit && hasRemote;
	}

	static async cancel(cancelToken: CancelToken, fs: FileStructure, repoPath: Path) {
		const gitRepository = new GitCommands(fs.fp.default(), repoPath);
		await gitRepository.cancel(cancelToken);
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
		allowNonEmptyDir = false,
		isBare = false,
		onProgress,
		repositoryPath,
	}: GitCloneData) {
		fs.fp.stopWatch();
		try {
			const gitRepository = new GitCommands(fs.fp.default(), repositoryPath);
			const currentUrl = getUrlFromGitStorageData(data);
			try {
				await gitRepository.clone(getHttpsRepositoryUrl(currentUrl), source, cancelToken, {
					branch,
					isBare,
					onProgress,
					allowNonEmptyDir,
				});
			} catch (e) {
				if (((e as GitError).cause as any)?.props?.errorCode === GitErrorCode.CancelledOperation) throw e;

				await (source as ProxiedSourceDataCtx<GitSourceData>).assertValid?.(e);
				throw e;
			}
		} finally {
			fs.fp?.startWatch();
		}
	}

	static async init(repositoryPath: Path, fp: FileProvider, data: GitStorageData) {
		if (
			data.source.sourceType == SourceType.gitHub ||
			data.source.sourceType == SourceType.gitVerse ||
			data.source.sourceType === SourceType.gitea
		) {
			const sourceApi = makeSourceApi(data.source) as GitSourceApi;
			assert(sourceApi, "sourceApi is missing");

			await sourceApi.createRepository(data);
		}

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
			this._syncCount = await this._gitRepository.countChangedFiles(this._syncSearchInPath);
		} catch (e) {
			this._syncCount = { pull: 0, push: 0, hasChanges: false };
			console.error(e);
		}
	}

	getRemoteName(): Promise<string> {
		return this._gitRepository.getRemoteName();
	}

	async pull(source: GitSourceData) {
		this._fp.stopWatch();

		try {
			const remoteName = (await this._gitRepository.getCurrentBranch()).getData().remoteName;
			if (remoteName) {
				try {
					await this._gitRepository.pull(source);
				} catch (e) {
					await (source as ProxiedSourceDataCtx<GitSourceData>)?.assertValid?.(e);
					throw e;
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

	async getStorageByPath(path: Path): Promise<{ storage: GitStorage; relativePath: Path }> {
		return { storage: this, relativePath: path };
	}

	async fetch(source: GitSourceData, force = false, lock = true) {
		try {
			await this._gitRepository.fetch(source, force, lock);
		} catch (e) {
			await (source as ProxiedSourceDataCtx<GitSourceData>).assertValid?.(e);
			throw e;
		}
		await this.updateSyncCount();
	}

	async update() {
		await this._initRepositoryUrl();
		await this.updateSyncCount();
	}

	deleteRemoteBranch(branch: string, data: GitSourceData): Promise<void> {
		return this._gitRepository.deleteBranch(branch, true, data);
	}

	async validateStorageName(source: GitSourceData) {
		const storageName = getStorageNameByData(source);
		assert(
			storageName === (await this.getSourceName()),
			`storage name mismatch: ${storageName} !== ${await this.getSourceName()}; can't push to this storage`,
		);
	}

	private async _initRepositoryUrl() {
		try {
			const hasRemote = await this._gitRepository.hasRemote();
			if (!hasRemote) return;
			this._url = await this._gitRepository.getRemoteUrl();
		} catch (error) {
			console.error("failed to get remote url", error);
		}
	}
}
