import getGitError from "@ext/git/core/GitCommands/errors/logic/getGitError";
import GitProgressEvent from "@ext/git/core/model/GitProgressEvent";
import Path from "../../../../logic/FileProvider/Path/Path";
import { VersionControlInfo } from "../../../VersionControl/model/VersionControlInfo";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import SourceData from "../../../storage/logic/SourceDataProvider/model/SourceData";
import { GitBranch } from "../GitBranch/GitBranch";
import { GitStatus } from "../GitWatcher/model/GitStatus";
import GitSourceData from "../model/GitSourceData.schema";
import { GitVersion } from "../model/GitVersion";
import SubmoduleData from "../model/SubmoduleData";
import * as git from "./LibGit2IntermediateCommands";
import GitCommandsModel from "./model/GitCommandsModel";

class LibGit2Commands implements GitCommandsModel {
	private _repoPath: string;

	constructor(repoPath: Path) {
		this._repoPath = repoPath.value;
	}

	async init(data: SourceData): Promise<void> {
		await git.init({ repoPath: this._repoPath, creds: this._intoCreds(data) });
	}

	async clone(
		url: string,
		source: GitSourceData,
		branch?: string,
		onProgress?: (progress: GitProgressEvent) => void,
	) {
		await git.clone(
			{ repoPath: this._repoPath, creds: this._intoCreds(source), remoteUrl: url, branch },
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
				type: FileStatus[s.status],
				isUntracked: true,
			})) ?? []
		);
	}

	async fileStatus(filePath: Path): Promise<GitStatus> {
		const status = await git.statusFile({ repoPath: this._repoPath, filePath: filePath.value });
		return {
			path: filePath,
			type: FileStatus[status],
			isUntracked: true,
		};
	}

	async push(data: GitSourceData): Promise<void> {
		await git.push({ repoPath: this._repoPath, creds: this._intoCreds(data) });
	}

	async fetch(data: GitSourceData): Promise<void> {
		await git.fetch({ repoPath: this._repoPath, creds: this._intoCreds(data) });
	}

	async checkout(ref: string, force?: boolean): Promise<void> {
		await git.checkout({ repoPath: this._repoPath, refName: ref, force: force ?? false });
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
			type: FileStatus[s.status],
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
		return git.stash({ repoPath: this._repoPath, message: "", creds: this._intoCreds(data) });
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

	getFixedSubmodulePaths(): Promise<Path[]> {
		return Promise.resolve([]);
	}

	getSubmodulesData(): Promise<SubmoduleData[]> {
		return Promise.resolve([]);
	}

	getRemoteName(): Promise<string> {
		const REMOTE = "origin";
		return Promise.resolve(REMOTE);
	}

	private _intoCreds(data: SourceData) {
		return {
			authorName: data.userName,
			authorEmail: data.userEmail,
			accessToken: "token" in data ? (data.token as string) : "",
			gitServerUsername: "gitServerUsername" in data ? (data.gitServerUsername as string) : "",
		};
	}
}

export default LibGit2Commands;
