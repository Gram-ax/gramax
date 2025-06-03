import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import gitMergeConverter from "@ext/git/actions/MergeConflictHandler/logic/GitMergeConverter";
import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import type { CommitAuthorInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import type {
	DiffConfig,
	DiffTree2TreeInfo,
	GcOptions,
	MergeMessageFormatOptions,
	MergeOptions,
	RefInfo,
} from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitStash from "@ext/git/core/model/GitStash";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../GitBranch/GitBranch";
import { GitCommands } from "../GitCommands/GitCommands";
import GitWatcher from "../GitWatcher/GitWatcher";
import { GitStatus } from "../GitWatcher/model/GitStatus";
import { GitVersion } from "../model/GitVersion";
import SubmoduleData from "../model/SubmoduleData";

export type GitVersionControlEvents = Event<"files-changed", { items: GitStatus[] }>;

export default class GitVersionControl {
	private _currentVersion: Promise<GitVersion>;
	private _currentBranch: Promise<GitBranch>;
	private _currentBranchName: Promise<string>;
	private _allBranches: Promise<GitBranch[]>;
	private _subGitVersionControls: Promise<GitVersionControl[]>;
	private _submodulesData: Promise<SubmoduleData[]>;
	private _gitWatcher: GitWatcher;
	private _gitRepository: GitCommands;
	private _events = createEventEmitter<GitVersionControlEvents>();
	private _relativeToParentPath: Path;

	constructor(private _path: Path, private _fp: FileProvider, relativeToParentPath: Path = new Path()) {
		this._relativeToParentPath = relativeToParentPath;
		this._gitRepository = new GitCommands(this._fp, this._path);
		this._gitWatcher = new GitWatcher(this);
		this._gitWatcher.watch(async (items) => {
			await this.events.emit("files-changed", {
				items: items.files.map((f) => ({ path: f.path, status: f.status })),
			});
		});
		void this._initSubGitVersionControls();
	}
	isInit(): Promise<boolean> {
		return this._gitRepository.isInit();
	}

	isBare(): Promise<boolean> {
		return this._gitRepository.isBare();
	}

	static async init(fp: FileProvider, path: Path, userData: SourceData): Promise<GitVersionControl> {
		await new GitCommands(fp, path).init(userData);
		return new GitVersionControl(path, fp);
	}

	get events() {
		return this._events;
	}

	getPath(): Path {
		return this._path;
	}

	get relativeToParentPath() {
		return this._relativeToParentPath;
	}

	getReferencesByGlob(patterns: string[]): Promise<RefInfo[]> {
		return this._gitRepository.getReferencesByGlob(patterns);
	}

	async getCurrentBranch(cached = true): Promise<GitBranch> {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		if (!cached || !this._currentBranch) this._initCurrentBranch();
		return this._currentBranch;
	}

	getCurrentBranchName(cached = true): Promise<string> {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		if (!cached || !this._currentBranchName) this._initCurrentBranchName();
		return this._currentBranchName;
	}

	async getAllBranches(): Promise<GitBranch[]> {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		if (!this._allBranches) this._initAllBranches();
		return this._allBranches;
	}

	getBranch(branchName: string): Promise<GitBranch> {
		return this._gitRepository.getBranch(branchName);
	}

	async getCurrentVersion(): Promise<GitVersion> {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		if (!this._currentVersion) this._initCurrentVersion();
		return this._currentVersion;
	}

	async showLastCommitContent(filePath: Path): Promise<string> {
		const { gitVersionControl, relativePath } = await this.getGitVersionControlContainsItem(filePath);
		const gitRepository = new GitCommands(this._fp, gitVersionControl.getPath());
		return gitRepository.showFileContent(relativePath);
	}

	async showFileContent(filePath: Path, revision: GitVersion): Promise<string> {
		return this._gitRepository.showFileContent(filePath, revision);
	}

	async createNewBranch(newBranchName: string) {
		await this._gitRepository.createNewBranch(newBranchName);
		this.update();
	}

	async deleteLocalBranch(branchName: string) {
		await this._gitRepository.deleteBranch(branchName, false);
	}

	async stash(data: SourceData, doAddBeforeStash = true): Promise<GitStash> {
		if (doAddBeforeStash) await this.add();
		return this._gitRepository.stash(data);
	}

	async applyStash(
		stashHash: GitStash,
		{
			restoreAfterStash = false,
			deleteAfterApply = true,
		}: { restoreAfterStash?: boolean; deleteAfterApply?: boolean } = {
			restoreAfterStash: false,
			deleteAfterApply: true,
		},
	): Promise<GitMergeResult[]> {
		const gitMergeResult = gitMergeConverter(await this._gitRepository.applyStash(stashHash));
		if (restoreAfterStash) {
			const status = (await this.getChanges()).map((x) => x.path);
			await this.restore(true, status);
		}
		if (deleteAfterApply) await this.deleteStash(stashHash);
		return gitMergeResult;
	}

	async deleteStash(stashHash: GitStash): Promise<void> {
		await this._gitRepository.deleteStash(stashHash);
	}

	async stashParent(stashHash: GitStash): Promise<GitVersion> {
		return this._gitRepository.stashParent(stashHash);
	}

	async getHeadCommit(ref?: string | GitBranch | GitStash) {
		return this._gitRepository.getHeadCommit(ref?.toString());
	}

	async getCommitHash(ref?: string) {
		return this._gitRepository.getCommitHash(ref?.toString());
	}

	async getParentCommitHash(hash: GitVersion) {
		return this._gitRepository.getParentCommit(hash);
	}

	async resetBranches(): Promise<GitBranch[]> {
		this._initAllBranches();
		return this._allBranches;
	}

	async add(filePaths?: Path[], force = false): Promise<void> {
		return this._gitRepository.add(filePaths, force);
	}

	async discard(filePaths: Path[]): Promise<void> {
		const storagesAndItsFiles = await this._getVersionControlsAndItsFiles(filePaths);
		for (const [storage, paths] of Array.from(storagesAndItsFiles)) {
			await storage.restore(true, paths);
			await storage.restore(false, paths);
		}
		const items: GitStatus[] = filePaths.map((path) => ({ path, status: FileStatus.modified }));
		await this._events.emit("files-changed", { items });
	}

	async checkChanges(oldVersion: GitVersion, newVersion: GitVersion): Promise<void> {
		await this._gitWatcher.checkChanges(oldVersion, newVersion);
	}

	async recursiveCheckChanges(
		oldVersion: GitVersion,
		newVersion: GitVersion,
		subOldVersions: { [path: string]: { version: GitVersion; subGvc: GitVersionControl } },
		subNewVersions: { [path: string]: { version: GitVersion; subGvc: GitVersionControl } },
	) {
		return this._gitWatcher.recursiveCheckChanges(oldVersion, newVersion, subOldVersions, subNewVersions);
	}

	async diff(opts: DiffConfig): Promise<DiffTree2TreeInfo> {
		return this._gitRepository.diff(opts);
	}

	async commit(
		message: string,
		userData: SourceData,
		parents?: (string | GitBranch)[],
		filesToPublish?: Path[],
	): Promise<void> {
		await this._gitRepository.commit(message, userData, parents, filesToPublish);
	}

	async setHead(refname: string) {
		await this._gitRepository.setHead(refname);
	}

	async checkoutToBranch(branch: GitBranch | string, force?: boolean) {
		this._fp.stopWatch();
		try {
			await this._gitRepository.checkout(branch, { force });
			this.update();
		} finally {
			this._fp?.startWatch();
		}
	}

	async mergeBranch(data: SourceData, opts: MergeOptions): Promise<GitMergeResult[]> {
		this._fp.stopWatch();
		try {
			return gitMergeConverter(await this._gitRepository.merge(data, opts));
		} finally {
			this._fp?.startWatch();
		}
	}

	async formatMergeMessage(data: SourceData, opts: MergeMessageFormatOptions): Promise<string> {
		return this._gitRepository.formatMergeMessage(data, opts);
	}

	async getChanges(type: "index" | "workdir" = "workdir", recursive = true): Promise<GitStatus[]> {
		const changeFiles = await this._gitRepository.status(type);
		if (recursive) {
			// const subGitVersionControls = await this._getSubGitVersionControls();
			// const subGitVersionControlChanges: GitStatus[][] = await Promise.all(
			// 	subGitVersionControls.map(async (s) => {
			// 		const relativeSubmodulePath = await this._getRelativeSubmodulePath(s.getPath());
			// 		const submoduleChanges = (await s.getChanges()).map(({ path, ...rest }) => ({
			// 			path: relativeSubmodulePath.join(path),
			// 			...rest,
			// 		}));
			// 		return submoduleChanges;
			// 	}),
			// );
			// return [...changeFiles, ...subGitVersionControlChanges.flat()];
		}
		return changeFiles;
	}

	async getFileStatus(filePath: Path): Promise<GitStatus> {
		return this._gitRepository.fileStatus(filePath);
	}

	update() {
		this._initCurrentBranch();
		this._initCurrentBranchName();
		this._initAllBranches();
		this._initCurrentVersion();
		this._initSubmodulesData();
		this._initSubGitVersionControls();
	}

	async restoreRepositoryState(): Promise<void> {
		const parent = await this.getParentCommitHash(await this.getHeadCommit());
		await this.softReset(parent);
	}

	async getGitVersionControlContainsItem(
		path: Path,
	): Promise<{ gitVersionControl: GitVersionControl; relativePath: Path }> {
		const submodules = await this.getSubGitVersionControls();
		for (const submodule of submodules) {
			const relativeSubmodulePath = await this._getRelativeSubmodulePath(submodule.getPath());
			if (path.startsWith(relativeSubmodulePath)) {
				return await submodule.getGitVersionControlContainsItem(
					relativeSubmodulePath.subDirectory(path).removeExtraSymbols,
				);
			}
		}
		return { gitVersionControl: this, relativePath: path };
	}

	async softReset(head?: GitVersion): Promise<void> {
		return this._gitRepository.softReset(head);
	}

	async hardReset(head?: GitVersion): Promise<void> {
		return this._gitRepository.hardReset(head);
	}

	async restore(staged: boolean, filePaths: Path[]): Promise<void> {
		return this._gitRepository.restore(staged, filePaths);
	}

	async checkoutSubGitVersionControls(): Promise<void> {
		const subGitVersionControls = await this.getSubGitVersionControls();
		const submodulesData = await this._getSubmodulesData();
		for (let i = 0; i < subGitVersionControls.length; i++) {
			const gvc = subGitVersionControls[i];
			const submoduleData = submodulesData[i];
			if (submoduleData.branch) {
				await gvc.checkoutToBranch(submoduleData.branch);
				continue;
			}
			try {
				await gvc.checkoutToBranch("master");
			} catch {
				try {
					await gvc.checkoutToBranch("main");
				} catch {
					throw new GitError(GitErrorCode.CheckoutSubmoduleError, null, {
						submodulePath: submoduleData.path,
					});
				}
			}
		}
	}

	gc(opts: GcOptions) {
		return this._gitRepository.gc(opts);
	}

	getCommitAuthors(): Promise<CommitAuthorInfo[]> {
		return this._gitRepository.getCommitAuthors();
	}

	async getSubGitVersionControls(): Promise<GitVersionControl[]> {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		if (!this._subGitVersionControls) this._initSubGitVersionControls();
		return this._subGitVersionControls;
	}

	private async _getRelativeSubmodulePath(submodulePath: Path): Promise<Path> {
		for (const data of await this._getSubmodulesData()) {
			if (submodulePath.endsWith(data.path)) return data.path;
		}
	}

	private async _getVersionControlsAndItsFiles(filePaths: Path[]): Promise<Map<GitVersionControl, Path[]>> {
		const versionControlsAndFiles = new Map<GitVersionControl, Path[]>();

		for (const filePath of filePaths) {
			const items = await this.getGitVersionControlContainsItem(filePath);
			if (!items) return;
			const { gitVersionControl, relativePath } = items;

			if (versionControlsAndFiles.has(gitVersionControl)) {
				versionControlsAndFiles.get(gitVersionControl).push(relativePath);
			} else {
				versionControlsAndFiles.set(gitVersionControl, [relativePath]);
			}
		}

		return versionControlsAndFiles;
	}

	private async _getSubmodulesData(): Promise<SubmoduleData[]> {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		if (!this._submodulesData) this._initSubmodulesData();
		return this._submodulesData;
	}

	private _initCurrentVersion(): void {
		this._currentVersion = this._gitRepository.getHeadCommit();
	}

	private _initCurrentBranch(): void {
		this._currentBranch = this._gitRepository.getCurrentBranch();
	}

	private _initCurrentBranchName(): void {
		this._currentBranchName = this._gitRepository.getCurrentBranchName();
	}

	private _initAllBranches(): void {
		this._allBranches = this._gitRepository.getAllBranches();
	}

	private _initSubGitVersionControls(): void {
		this._subGitVersionControls = this._getSubmodulesData().then(async (submodulesData) => {
			const controls = await Promise.all(
				submodulesData.map(async (data) => {
					const fullSubmodulePath = this._path.join(data.path);
					if (await this._gitRepository.isSubmoduleExist(data.path))
						return new GitVersionControl(fullSubmodulePath, this._fp, data.path);
				}),
			);
			return controls.filter((x) => x);
		});
	}

	private _initSubmodulesData(): void {
		this._submodulesData = this._gitRepository.getSubmodulesData();
	}
}
