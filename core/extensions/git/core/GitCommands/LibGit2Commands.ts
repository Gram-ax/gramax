import { LibGit2BaseCommands } from "@ext/git/core/GitCommands/LibGit2BaseCommands";
import getGitError from "@ext/git/core/GitCommands/errors/logic/getGitError";
import Path from "../../../../logic/FileProvider/Path/Path";
import { VersionControlInfo } from "../../../VersionControl/model/VersionControlInfo";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../GitBranch/GitBranch";
import { GitStatus } from "../GitWatcher/model/GitStatus";
import GitSourceData from "../model/GitSourceData.schema";
import { GitVersion } from "../model/GitVersion";
import * as git from "./LibGit2IntermediateCommands";
import GitCommandsModel, {
	type CloneProgress,
	type DirEntry,
	type DirStat,
	type FileStat,
	type RefInfo,
	type TreeReadScope,
} from "./model/GitCommandsModel";

class LibGit2Commands extends LibGit2BaseCommands implements GitCommandsModel {
	constructor(repoPath: Path) {
		super(repoPath.value);
	}

	isInit(): Promise<boolean> {
		return git.isInit({ repoPath: this._repoPath });
	}

	isBare(): Promise<boolean> {
		return git.isBare({ repoPath: this._repoPath });
	}

	async init(data: SourceData): Promise<void> {
		await git.init({ repoPath: this._repoPath, creds: this._intoCreds(data) });
	}

	async clone(
		url: string,
		source: GitSourceData,
		branch?: string,
		depth?: number,
		isBare?: boolean,
		onProgress?: (progress: CloneProgress) => void,
	) {
		await git.clone(
			{ creds: this._intoCreds(source), opts: { to: this._repoPath, url, branch, depth, isBare } },
			onProgress,
		);
	}

	async commit(message: string, data: SourceData, parents?: string[]): Promise<GitVersion> {
		await git.commit({ repoPath: this._repoPath, creds: this._intoCreds(data), message, parents });
		const oid = (await this.getHeadCommit("HEAD")).toString();
		return new GitVersion(oid);
	}

	async status(): Promise<GitStatus[]> {
		const status = await git.status({ repoPath: this._repoPath });
		return (
			status?.map((s) => ({
				path: new Path(s.path),
				status: FileStatus[s.status],
				isUntracked: true,
			})) ?? []
		);
	}

	async fileStatus(filePath: Path): Promise<GitStatus> {
		const status = await git.statusFile({ repoPath: this._repoPath, filePath: filePath.value });
		return {
			path: filePath,
			status: FileStatus[status],
			isUntracked: true,
		};
	}

	async push(data: GitSourceData): Promise<void> {
		await git.push({ repoPath: this._repoPath, creds: this._intoCreds(data) });
	}

	async fetch(data: GitSourceData, force = false): Promise<void> {
		await git.fetch({ repoPath: this._repoPath, creds: this._intoCreds(data), force });
	}

	async checkout(ref: string, force?: boolean): Promise<void> {
		await git.checkout({ repoPath: this._repoPath, refName: ref, force: force ?? false });
	}

	async setHead(refname: string): Promise<void> {
		await git.setHead({ repoPath: this._repoPath, refname });
	}

	async merge(data: GitSourceData, theirs: string): Promise<git.MergeResult> {
		const res = await git.merge({ repoPath: this._repoPath, creds: this._intoCreds(data), theirs });
		return res?.length ? res : [];
	}

	async add(paths?: Path[]) {
		const patterns = paths?.map((p) => p.value) ?? ["."];
		await git.add({ repoPath: this._repoPath, patterns });
	}

	async diff(oldTree: string, newTree: string): Promise<GitStatus[]> {
		const statuses = await git.diff({ repoPath: this._repoPath, old: oldTree, new: newTree });
		return statuses.map((s) => ({
			path: new Path(s.path),
			status: FileStatus[s.status],
			isUntracked: true,
		}));
	}

	getFileHistory(filePath: Path, count: number): Promise<VersionControlInfo[]> {
		return git.fileHistory({ repoPath: this._repoPath, filePath: filePath.value, count });
	}

	async getCurrentBranch(): Promise<GitBranch> {
		const data = await git.branchInfo({ repoPath: this._repoPath });
		return new GitBranch(data);
	}

	async getCurrentBranchName(): Promise<string> {
		const data = await git.branchInfo({ repoPath: this._repoPath });
		return data.name;
	}

	async getAllBranches(): Promise<GitBranch[]> {
		const data = await git.getAllBranches({ repoPath: this._repoPath });
		return data
			.map((d) => {
				d.name = d.name.replace("origin/", "");
				return d;
			})
			.map((d) => new GitBranch(d));
	}

	async getBranch(name: string): Promise<GitBranch> {
		const data = await git.branchInfo({ repoPath: this._repoPath, name });
		return new GitBranch(data);
	}

	async getCommitHash(ref: string): Promise<GitVersion> {
		const data = await git.branchInfo({ repoPath: this._repoPath, name: ref });
		return new GitVersion(data.lastCommitOid);
	}

	deleteBranch(name: string, remote?: boolean, data?: GitSourceData): Promise<void> {
		return git.deleteBranch({
			repoPath: this._repoPath,
			name,
			remote: remote ?? false,
			creds: data ? this._intoCreds(data) : undefined,
		});
	}

	async addRemote(url: string): Promise<void> {
		await git.addRemote({ repoPath: this._repoPath, name: "origin", url });
	}

	newBranch(name: string): Promise<void> {
		return git.newBranch({ repoPath: this._repoPath, name });
	}

	restore(staged: boolean, filePaths: Path[]): Promise<void> {
		return git.restore({ repoPath: this._repoPath, staged, paths: filePaths.map((p) => p.value) });
	}

	resetHard(head?: GitVersion): Promise<void> {
		return git.resetAll({ repoPath: this._repoPath, hard: true, head: head?.toString() });
	}

	resetSoft(head?: GitVersion): Promise<void> {
		return git.resetAll({ repoPath: this._repoPath, hard: false, head: head?.toString() });
	}

	getParentCommit(commitOid: string): Promise<string> {
		return git.getParent({ repoPath: this._repoPath, oid: commitOid });
	}

	async applyStash(stashOid: string): Promise<git.MergeResult> {
		try {
			const res = await git.stashApply({ repoPath: this._repoPath, oid: stashOid });
			return res?.length ? res : [];
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath, theirs: stashOid });
		}
	}

	graphHeadUpstreamFilesCount(searchIn: string): Promise<git.UpstreamCountFileChanges> {
		return git.graphHeadUpstreamFiles({ repoPath: this._repoPath, searchIn });
	}

	deleteStash(stashOid: string): Promise<void> {
		return git.stashDelete({ repoPath: this._repoPath, oid: stashOid });
	}

	stash(data: SourceData): Promise<string> {
		return git.stash({ repoPath: this._repoPath, creds: this._intoCreds(data), message: "" });
	}

	async stashParent(stashOid: string): Promise<GitVersion> {
		return new GitVersion(await this.getParentCommit(stashOid));
	}

	async getHeadCommit(branch: string): Promise<GitVersion> {
		const data = await git.branchInfo({ repoPath: this._repoPath, name: branch });
		return new GitVersion(data.lastCommitOid);
	}

	async getRemoteBranchName(name: string): Promise<string> {
		const branch = await this.getBranch(name);
		return branch.getData().remoteName;
	}

	getRemoteUrl(): Promise<string> {
		return git.getRemoteUrl({ repoPath: this._repoPath });
	}

	hasRemote(): Promise<boolean> {
		return git.hasRemotes({ repoPath: this._repoPath });
	}

	showFileContent(path: Path, hash?: GitVersion): Promise<string> {
		return git.getContent({ repoPath: this._repoPath, path: path.value, oid: hash ? hash.toString() : undefined });
	}

	getRemoteName(): Promise<string> {
		const REMOTE = "origin";
		return Promise.resolve(REMOTE);
	}

	readFile(filePath: Path, scope: TreeReadScope): Promise<ArrayBuffer> {
		return git.readFile({ repoPath: this._repoPath, scope, path: filePath.value });
	}

	readDir(dirPath: Path, scope: TreeReadScope): Promise<DirEntry[]> {
		return git.readDir({ repoPath: this._repoPath, scope, path: dirPath.value });
	}

	fileStat(filePath: Path, scope: TreeReadScope): Promise<FileStat> {
		return git.fileStat({ repoPath: this._repoPath, scope, path: filePath.value });
	}

	readDirStats(dirPath: Path, scope: TreeReadScope): Promise<DirStat[]> {
		return git.readDirStats({ repoPath: this._repoPath, scope, path: dirPath.value });
	}

	fileExists(filePath: Path, scope: TreeReadScope): Promise<boolean> {
		return git.fileExists({ repoPath: this._repoPath, scope, path: filePath.value });
	}

	async getReferencesByGlob(patterns: string[]): Promise<RefInfo[]> {
		const refs = await git.getRefsByGlobs({ repoPath: this._repoPath, patterns });
		return refs.map((r) => {
			if (r.kind === "tag") {
				return {
					kind: r.kind,
					name: r.name,
					encodedName: encodeURIComponent(r.name),
					oid: new GitVersion(r.oid),
					isLightweight: !!r.isLightweight,
					author: r.author,
					date: new Date(r.date),
				};
			}
			return {
				kind: r.kind,
				name: r.name,
				encodedName: encodeURIComponent(r.name),
				date: new Date(r.date),
			};
		});
	}
}

export default LibGit2Commands;
