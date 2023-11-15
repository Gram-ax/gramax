import GitRepositoryConfig from "@ext/git/core/GitRepository/model/GitRepositoryConfig";
import GitStash from "@ext/git/core/model/GitStash";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import VersionControl from "../../../VersionControl/VersionControl";
import VersionControlType from "../../../VersionControl/model/VersionControlType";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import { ItemStatus } from "../../../Watchers/model/ItemStatus";
import SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../GitBranch/GitBranch";
import { GitRepository } from "../GitRepository/GitRepository";
import GitError from "../GitRepository/errors/GitError";
import GitErrorCode from "../GitRepository/errors/model/GitErrorCode";
import convertToChangeItem from "../GitWatcher/ConvertToChangeItem";
import GitWatcher from "../GitWatcher/GitWatcher";
import { GitStatus } from "../GitWatcher/model/GitStatus";
import { GitVersion } from "../model/GitVersion";
import SubmoduleData from "../model/SubmoduleData";

export default class GitVersionControl implements VersionControl {
	private _watcherFunc: ((changes: ItemStatus[]) => void)[];
	private _currentVersion: GitVersion;
	private _currentBranch: GitBranch;
	private _allBranches: GitBranch[];
	private _subGitVersionControls: GitVersionControl[];
	private _submodulesData: SubmoduleData[];
	private _gitWatcher: GitWatcher;
	private _gitRepository: GitRepository;

	constructor(private _conf: GitRepositoryConfig, private _path: Path, private _fp: FileProvider) {
		this._gitRepository = new GitRepository(_conf, this._fp, this._path);
		this._gitWatcher = new GitWatcher(this._gitRepository);
		this._gitWatcher.watch(this._onChange.bind(this));
		this._watcherFunc = [];
		void this._initSubGitVersionControls();
	}

	watch(w: (changeFiles: ItemStatus[]) => void): void {
		this._watcherFunc.push(w);
	}

	getType() {
		return VersionControlType.git;
	}

	static hasInit(conf: GitRepositoryConfig, fp: FileProvider, path: Path): Promise<boolean> {
		return new GitRepository(conf, fp, path).hasInit();
	}

	static async init(
		conf: GitRepositoryConfig,
		fp: FileProvider,
		path: Path,
		userData: SourceData,
	): Promise<GitVersionControl> {
		await new GitRepository(conf, fp, path).init(userData);
		return new GitVersionControl(conf, path, fp);
	}

	getPath(): Path {
		return this._path;
	}

	async getCurrentBranch(): Promise<GitBranch> {
		if (!this._currentBranch) await this._initCurrentBranch();
		return this._currentBranch;
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
		const { versionControl, relativePath } = await this.getVersionControlContainsItem(filePath);
		const gitRepository = new GitRepository(this._conf, this._fp, versionControl.getPath());
		return gitRepository.showFileContent(relativePath);
	}

	async createNewBranch(newBranchName: string) {
		await this._gitRepository.createNewBranch(newBranchName);
		await this._initCurrentBranch();
	}

	async deleteLocalBranch(branchName: string) {
		await this._gitRepository.deleteBranch(branchName, false);
	}

	stash(data: SourceData): Promise<GitStash> {
		return this._gitRepository.stash(data);
	}

	async applyStash(data: SourceData, stashHash: GitStash): Promise<void> {
		await this._gitRepository.applyStash(data, stashHash);
	}

	async deleteStash(stashHash: GitStash): Promise<void> {
		await this._gitRepository.deleteStash(stashHash);
	}

	stashParent(stashHash: GitStash): Promise<GitVersion> {
		return this._gitRepository.stashParent(stashHash);
	}

	async getCommitHash(ref?: string | GitBranch | GitStash) {
		return this._gitRepository.getHeadCommit(ref.toString());
	}

	async getParentCommitHash(hash: GitVersion) {
		return this._gitRepository.getParentCommit(hash);
	}

	async resetBranches(): Promise<GitBranch[]> {
		await this._initAllBranches();
		return this._allBranches;
	}

	async add(filePaths: Path[]): Promise<void> {
		const versionContolsAndItsFiles = await this._getVersionControlsAndItsFiles(filePaths);
		for (const [storage, paths] of Array.from(versionContolsAndItsFiles)) {
			const gitRepository = new GitRepository(this._conf, this._fp, storage.getPath());
			await gitRepository.add(paths);
		}
	}

	async discard(filePaths: Path[]): Promise<void> {
		const storagesAndItsFiles = await this._getVersionControlsAndItsFiles(filePaths);
		for (const [storage, paths] of Array.from(storagesAndItsFiles)) {
			await storage.restore(false, paths);
		}
		const gitChangeFiles: GitStatus[] = filePaths.map((path) => ({ path, type: FileStatus.modified }));
		this._onChange(gitChangeFiles);
	}

	async checkChanges(oldVersion: GitVersion, newVersion: GitVersion): Promise<void> {
		await this._gitWatcher.checkChanges(oldVersion, newVersion);
	}

	async commit(message: string, userData: SourceData, parents?: (string | GitBranch)[]): Promise<void> {
		const subModules = await this._getSubGitVersionControls();
		for (const s of subModules) await s.commit(message, userData);
		await this._gitRepository.commit(message, userData, parents);
	}

	async checkoutToBranch(branch: GitBranch | string) {
		this._fp.stopWatch();
		await this._gitRepository.checkout(branch);
		await this.update();
		this._fp.startWatch();
	}

	async mergeBranch(data: SourceData, theirs: GitBranch | string) {
		if ((await this.getChanges(false)).length > 0)
			throw new GitError(GitErrorCode.WorkingDirNotEmpty, null, { repositoryPath: this._path.value });

		this._fp.stopWatch();
		await this._gitRepository.merge(data, theirs.toString(), false);
		this._fp.startWatch();
	}

	async getChanges(recursive = true): Promise<GitStatus[]> {
		const changeFiles = await this._gitRepository.status();
		if (!recursive) return changeFiles;
		const subGitVersionControls = await this._getSubGitVersionControls();
		const subGitVersionControlChanges: GitStatus[][] = await Promise.all(
			subGitVersionControls.map(async (s) => {
				const relativeSubmodulePath = await this._getRelativeSubmodulePath(s.getPath());
				const submoduleChanges = (await s.getChanges()).map(({ path, isUntracked, type }) => ({
					path: relativeSubmodulePath.join(path),
					isUntracked,
					type,
				}));
				return submoduleChanges;
			}),
		);
		return [...changeFiles, ...subGitVersionControlChanges.flat()];
	}

	async update() {
		await this._initCurrentBranch();
		await this._initAllBranches();
		await this._initCurrentVersion();
		await this._initSubmodulesData();
		await this._initSubGitVersionControls();
	}

	async restoreRepositoryState(): Promise<void> {
		await this.softReset();
		const changes = await this.getChanges();
		await this.restore(
			true,
			changes.map((c) => c.path),
		);
	}

	async getVersionControlContainsItem(
		path: Path,
	): Promise<{ versionControl: GitVersionControl; relativePath: Path }> {
		const submodules = await this._getSubGitVersionControls();
		for (const submodule of submodules) {
			const relativeSubmodulePath = await this._getRelativeSubmodulePath(submodule.getPath());
			if (path.startsWith(relativeSubmodulePath)) {
				return await submodule.getVersionControlContainsItem(
					relativeSubmodulePath.subDirectory(path).removeExtraSymbols,
				);
			}
		}
		return { versionControl: this, relativePath: path };
	}

	async softReset(head?: GitVersion): Promise<void> {
		return this._gitRepository.softReset(head);
	}

	async hardReset(): Promise<void> {
		return this._gitRepository.hardReset();
	}

	async restore(staged: boolean, filePaths: Path[]): Promise<void> {
		return this._gitRepository.restore(staged, filePaths);
	}

	private async _getRelativeSubmodulePath(submodulePath: Path): Promise<Path> {
		for (const data of await this._getSubmodulesData()) {
			if (submodulePath.endsWith(data.path)) return data.path;
		}
	}

	private async _getVersionControlsAndItsFiles(filePaths: Path[]): Promise<Map<GitVersionControl, Path[]>> {
		const versionControlsAndFiles = new Map<GitVersionControl, Path[]>();

		for (const filePath of filePaths) {
			const items = await this.getVersionControlContainsItem(filePath);
			if (!items) return;
			const { versionControl, relativePath } = items;

			if (versionControlsAndFiles.has(versionControl)) {
				versionControlsAndFiles.get(versionControl).push(relativePath);
			} else {
				versionControlsAndFiles.set(versionControl, [relativePath]);
			}
		}

		return versionControlsAndFiles;
	}

	private async _getSubmodulesData() {
		if (!this._submodulesData) await this._initSubmodulesData();
		return this._submodulesData;
	}

	private _onChange(changeFiles: GitStatus[]): void {
		this._watcherFunc.forEach((f) => f(convertToChangeItem(changeFiles, this._fp)));
	}

	private async _getSubGitVersionControls(): Promise<GitVersionControl[]> {
		if (!this._subGitVersionControls) await this._initSubGitVersionControls();
		return this._subGitVersionControls;
	}

	private async _initCurrentVersion() {
		this._currentVersion = await this._gitRepository.getHeadCommit();
	}

	private async _initCurrentBranch() {
		this._currentBranch = await this._gitRepository.getCurrentBranch();
	}

	private async _initAllBranches() {
		this._allBranches = await this._gitRepository.getAllBranches();
	}

	private async _initSubGitVersionControls(): Promise<void> {
		this._subGitVersionControls = await this._getFixedSubVersionControls();
	}

	private async _getFixedSubVersionControls(): Promise<GitVersionControl[]> {
		try {
			return (await this._gitRepository.getFixedSubmodulePaths()).map((path) => {
				const subGitStorage = new GitVersionControl(this._conf, path, this._fp);
				return subGitStorage;
			});
		} catch {
			return [];
		}
	}

	private async _initSubmodulesData() {
		this._submodulesData = await this._gitRepository.getSubmodulesData();
	}
}
