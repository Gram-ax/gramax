import { createEventEmitter, type Event } from "@core/Event/EventEmitter";
import gitMergeConverter from "@ext/git/actions/MergeConflictHandler/logic/GitMergeConverter";
import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import type { CommitAuthorInfo } from "@ext/git/core/GitCommands/LibGit2IntermediateCommands";
import type {
	DiffConfig,
	DiffTree2TreeInfo,
	GcOptions,
	MergeMessageFormatOptions,
	MergeOptions,
	RefInfo,
	ResetOptions,
} from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitStash from "@ext/git/core/model/GitStash";
import GitVersionData from "@ext/git/core/model/GitVersionData";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../GitBranch/GitBranch";
import { GitCommands } from "../GitCommands/GitCommands";
import GitWatcher from "../GitWatcher/GitWatcher";
import { GitStatus } from "../GitWatcher/model/GitStatus";
import { GitVersion } from "../model/GitVersion";

export type GitVersionControlEvents = Event<"files-changed", { items: GitStatus[] }>;
export type GitVersionDataSet = {
	data: GitVersionData[];
	reachedFirstCommit: boolean;
};

export default class GitVersionControl {
	private _currentVersion: Promise<GitVersion>;
	private _currentBranch: Promise<GitBranch>;
	private _currentBranchName: Promise<string>;
	private _allBranches: Promise<GitBranch[]>;
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
		const { gitVersionControl, relativePath } = await this.getVersionControlByPath(filePath);
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

		// needed in case of dummy conflicts: when a file marked as conflited but no actual conflicts are present
		// in other case stash will fail with error: cannot create a tree from a not fully merged index; class=Index (10); code=Unmerged (-10)
		await this.reset({ mode: "mixed" });

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

	async getChanges(type: "index" | "workdir" = "workdir"): Promise<GitStatus[]> {
		return this._gitRepository.status(type);
	}

	async getFileStatus(filePath: Path): Promise<GitStatus> {
		return this._gitRepository.fileStatus(filePath);
	}

	update() {
		this._initCurrentBranch();
		this._initCurrentBranchName();
		this._initAllBranches();
		this._initCurrentVersion();
	}

	async restoreRepositoryState(): Promise<void> {
		const parent = await this.getParentCommitHash(await this.getHeadCommit());
		await this.reset({ mode: "soft", head: parent });
	}

	async getVersionControlByPath(path: Path): Promise<{ gitVersionControl: GitVersionControl; relativePath: Path }> {
		return { gitVersionControl: this, relativePath: path };
	}

	async reset(opts: ResetOptions): Promise<void> {
		return this._gitRepository.reset(opts);
	}

	async restore(staged: boolean, filePaths: Path[]): Promise<void> {
		return this._gitRepository.restore(staged, filePaths);
	}

	async gc(opts: GcOptions): Promise<void> {
		return await this._gitRepository.gc(opts);
	}

	async healthcheck(): Promise<void> {
		return await this._gitRepository.healthcheck();
	}

	getCommitAuthors(): Promise<CommitAuthorInfo[]> {
		return this._gitRepository.getCommitAuthors();
	}

	haveConflictsWithBranch(branch: GitBranch | string, data: SourceData): Promise<boolean> {
		return this._gitRepository.haveConflictsWithBranch(branch, data);
	}

	async getCommitInfo(oid?: GitVersion, depth = 20): Promise<GitVersionDataSet> {
		oid = oid ?? (await this.getHeadCommit());
		const data = await this._gitRepository.getCommitInfo(oid, { depth, simplify: true });
		let reachedFirstCommit = false;
		if (data.length < depth) reachedFirstCommit = true;
		else {
			try {
				reachedFirstCommit = !(await this.getParentCommitHash(new GitVersion(data[data.length - 1].oid)));
			} catch {
				reachedFirstCommit = true;
			}
		}

		return {
			data: data.map(
				(x): GitVersionData => ({
					author: x.author,
					timestamp: x.timestamp,
					oid: x.oid,
					summary: x.summary,
					parents: x.parents,
				}),
			),
			reachedFirstCommit,
		};
	}

	private async _getVersionControlsAndItsFiles(filePaths: Path[]): Promise<Map<GitVersionControl, Path[]>> {
		const versionControlsAndFiles = new Map<GitVersionControl, Path[]>();

		for (const filePath of filePaths) {
			const items = await this.getVersionControlByPath(filePath);
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
}
