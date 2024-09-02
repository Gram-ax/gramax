import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import gitMergeConverter from "@ext/git/actions/MergeConflictHandler/logic/GitMergeConverter";
import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import GitError from "@ext/git/core/GitCommands/errors/GitError";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
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
	private _currentVersion: GitVersion;
	private _currentBranch: GitBranch;
	private _currentBranchName: string;
	private _allBranches: GitBranch[];
	private _subGitVersionControls: GitVersionControl[];
	private _submodulesData: SubmoduleData[];
	private _gitWatcher: GitWatcher;
	private _gitRepository: GitCommands;
	private _events = createEventEmitter<GitVersionControlEvents>();
	private _relativeToParentPath: Path;

	constructor(private _path: Path, private _fp: FileProvider, relativeToParentPath: Path = new Path()) {
		this._relativeToParentPath = relativeToParentPath;
		this._gitRepository = new GitCommands(this._fp, this._path);
		this._gitWatcher = new GitWatcher(this);
		this._gitWatcher.watch(async (items) => {
			await this.events.emit("files-changed", { items });
		});
		void this._initSubGitVersionControls();
	}

	static hasInit(fp: FileProvider, path: Path): Promise<boolean> {
		return new GitCommands(fp, path).hasInit();
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

	async getCurrentBranch(cached = true): Promise<GitBranch> {
		if (!cached || !this._currentBranch) await this._initCurrentBranch();
		return this._currentBranch;
	}

	async getCurrentBranchName(cached = true): Promise<string> {
		if (!cached || !this._currentBranchName) await this._initCurrentBranchName();
		return this._currentBranchName;
	}

	async getAllBranches(): Promise<GitBranch[]> {
		if (!this._allBranches) await this._initAllBranches();
		return this._allBranches;
	}

	getBranch(branchName: string): Promise<GitBranch> {
		return this._gitRepository.getBranch(branchName);
	}

	async getCurrentVersion(): Promise<GitVersion> {
		if (!this._currentVersion) await this._initCurrentVersion();
		return this._currentVersion;
	}

	async showLastCommitContent(filePath: Path): Promise<string> {
		const { gitVersionControl, relativePath } = await this.getGitVersionControlContainsItem(filePath);
		const gitRepository = new GitCommands(this._fp, gitVersionControl.getPath());
		return gitRepository.showFileContent(relativePath);
	}

	async createNewBranch(newBranchName: string) {
		await this._gitRepository.createNewBranch(newBranchName);
		await this.update();
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
			restoreAfterStash = true,
			deleteAfterApply = true,
		}: { restoreAfterStash?: boolean; deleteAfterApply?: boolean } = {
			restoreAfterStash: true,
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
		await this._initAllBranches();
		return this._allBranches;
	}

	async add(filePaths?: Path[]): Promise<void> {
		if (!filePaths) return this._gitRepository.add();
		const versionContolsAndItsFiles = await this._getVersionControlsAndItsFiles(filePaths);
		for (const [storage, paths] of Array.from(versionContolsAndItsFiles)) {
			const gitRepository = new GitCommands(this._fp, storage.getPath());
			await gitRepository.add(paths);
		}
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

	async diff(oldVersion: GitVersion | GitBranch, newVersion: GitVersion | GitBranch): Promise<GitStatus[]> {
		return this._gitRepository.diff(oldVersion, newVersion);
	}

	async commit(message: string, userData: SourceData, parents?: (string | GitBranch)[]): Promise<void> {
		// const subModules = await this._getSubGitVersionControls();
		// for (const s of subModules) {
		// 	if ((await s.getChanges()).length > 0) await s.commit(message, userData);
		// }
		await this._gitRepository.commit(message, userData, parents);
	}

	async checkoutToBranch(branch: GitBranch | string) {
		this._fp.stopWatch();
		try {
			await this._gitRepository.checkout(branch);
			await this.update();
		} finally {
			this._fp?.startWatch();
		}
	}

	async mergeBranch(data: SourceData, theirs: GitBranch | string): Promise<GitMergeResult[]> {
		this._fp.stopWatch();
		try {
			return gitMergeConverter(await this._gitRepository.merge(data, theirs.toString()));
		} finally {
			this._fp?.startWatch();
		}
	}

	async getChanges(recursive = true): Promise<GitStatus[]> {
		const changeFiles = await this._gitRepository.status();
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

	async update() {
		await this._initCurrentBranch();
		await this._initCurrentBranchName();
		await this._initAllBranches();
		await this._initCurrentVersion();
		await this._initSubmodulesData();
		await this._initSubGitVersionControls();
	}

	async restoreRepositoryState(): Promise<void> {
		const parent = await this.getParentCommitHash(await this.getHeadCommit());
		await this.softReset(parent);
		const changes = await this.getChanges();
		await this.restore(
			true,
			changes.map((c) => c.path),
		);
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

	async getSubGitVersionControls(): Promise<GitVersionControl[]> {
		if (!this._subGitVersionControls) await this._initSubGitVersionControls();
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

	private async _getSubmodulesData() {
		if (!this._submodulesData) await this._initSubmodulesData();
		return this._submodulesData;
	}

	private async _initCurrentVersion() {
		this._currentVersion = await this._gitRepository.getHeadCommit();
	}

	private async _initCurrentBranch() {
		this._currentBranch = await this._gitRepository.getCurrentBranch();
	}

	private async _initCurrentBranchName() {
		this._currentBranchName = await this._gitRepository.getCurrentBranchName();
	}

	private async _initAllBranches() {
		this._allBranches = await this._gitRepository.getAllBranches();
	}

	private async _initSubGitVersionControls(): Promise<void> {
		const getSubmodulesData = await this._getSubmodulesData();

		this._subGitVersionControls = await Promise.all(
			getSubmodulesData.map(async (data) => {
				const fullSubmodulePath = this._path.join(data.path);
				if (await this._gitRepository.isSubmoduleExist(data.path))
					return new GitVersionControl(fullSubmodulePath, this._fp, data.path);
			}),
		).then((x) => x.filter((x) => x));
	}

	private async _initSubmodulesData() {
		this._submodulesData = await this._gitRepository.getSubmodulesData();
	}
}
