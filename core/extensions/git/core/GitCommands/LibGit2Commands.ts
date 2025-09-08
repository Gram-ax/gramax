import { LibGit2BaseCommands } from "@ext/git/core/GitCommands/LibGit2BaseCommands";
import getGitError from "@ext/git/core/GitCommands/errors/logic/getGitError";
import GitVersionData from "@ext/git/core/model/GitVersionData";
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
	type CloneCancelToken,
	type CloneProgress,
	type DiffConfig,
	type DiffTree2TreeInfo,
	type DirEntry,
	type DirStat,
	type FileStat,
	type GcOptions,
	type MergeOptions,
	type RefInfo,
	type ResetOptions,
	type TreeReadScope,
} from "./model/GitCommandsModel";

class LibGit2Commands extends LibGit2BaseCommands implements GitCommandsModel {
	constructor(repoPath: Path) {
		super(repoPath.value);
	}

	format_merge_message(data: SourceData, opts: MergeOptions): Promise<string> {
		throw new Error("Method not implemented.");
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
		cancelToken: CloneCancelToken,
		branch?: string,
		depth?: number,
		isBare?: boolean,
		onProgress?: (progress: CloneProgress) => void,
	) {
		try {
			await git.clone(
				{
					creds: this._intoCreds(source),
					opts: { to: this._repoPath, url, cancelToken, branch, depth, isBare },
				},
				onProgress,
			);
		} catch (e) {
			throw getGitError(e, { repositoryPath: this._repoPath, repUrl: url, branchName: branch }, "clone");
		}
	}

	cloneCancel(id: number): Promise<boolean> {
		return git.cloneCancel(id);
	}

	getAllCancelTokens(): Promise<number[]> {
		return git.getAllCancelTokens();
	}

	async commit(message: string, data: SourceData, parents?: string[], paths?: string[]): Promise<GitVersion> {
		await git.commit({
			repoPath: this._repoPath,
			creds: this._intoCreds(data),
			opts: { message, parentRefs: parents || null, files: paths || null },
		});
		const oid = (await this.getHeadCommit("HEAD")).toString();
		return new GitVersion(oid);
	}

	async status(type: "index" | "workdir"): Promise<GitStatus[]> {
		const status = await git.status({ repoPath: this._repoPath, index: type === "index" });
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

	async fetch(data: GitSourceData, force = false, lock = true): Promise<void> {
		await git.fetch({ repoPath: this._repoPath, creds: this._intoCreds(data), force, lock });
	}

	async checkout(ref: string, force?: boolean): Promise<void> {
		await git.checkout({ repoPath: this._repoPath, refName: ref, force: force ?? false });
	}

	async setHead(refname: string): Promise<void> {
		await git.setHead({ repoPath: this._repoPath, refname });
	}

	async merge(data: GitSourceData, opts: MergeOptions): Promise<git.MergeResult> {
		const res = await git.merge({ repoPath: this._repoPath, creds: this._intoCreds(data), opts });
		return res?.length ? res : [];
	}

	async formatMergeMessage(data: SourceData, opts: MergeOptions): Promise<string> {
		return git.formatMergeMessage({ repoPath: this._repoPath, creds: this._intoCreds(data), opts });
	}

	async add(paths?: Path[], force = false) {
		const patterns = paths?.map((p) => p.value);
		await git.add({ repoPath: this._repoPath, patterns: patterns?.length ? patterns : ["."], force });
	}

	async diff(opts: DiffConfig): Promise<DiffTree2TreeInfo> {
		if (opts.compare.type === "tree") {
			if (opts.compare.old) opts.compare.old = opts.compare.old.toString() as any;
			if (opts.compare.new) opts.compare.new = opts.compare.new.toString() as any;
		}

		if (opts.compare.type === "workdir" || opts.compare.type === "index") {
			if (opts.compare.tree) opts.compare.tree = opts.compare.tree.toString() as any;
		}

		const info = await git.diff({ repoPath: this._repoPath, opts });
		if (!info) return;
		info.files = info.files.map((s) => ({
			...s,
			status: FileStatus[s.status],
			oldPath: s.oldPath ? new Path(s.oldPath as unknown as string) : undefined,
			path: new Path(s.path as unknown as string),
		}));

		return info;
	}

	getFileHistory(filePath: Path, count: number): Promise<VersionControlInfo[]> {
		return git.fileHistory({ repoPath: this._repoPath, filePath: filePath.value, count });
	}

	async getCommitInfo(oid: string, opts: { depth: number; simplify: boolean }): Promise<GitVersionData[]> {
		const raw = await git.getCommitInfo({ repoPath: this._repoPath, oid, opts });
		return raw.map((r) => ({
			author: r.author,
			timestamp: r.timestamp,
			oid: r.oid,
			summary: r.summary,
			parents: r.parents,
		}));
	}

	async getDefaultBranch(source: GitSourceData): Promise<GitBranch | null> {
		const branch = await git.defaultBranch({ repoPath: this._repoPath, creds: this._intoCreds(source) });
		return branch ? new GitBranch(branch) : null;
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

	reset(opts: ResetOptions): Promise<void> {
		return git.reset({
			repoPath: this._repoPath,
			opts: {
				mode: opts.mode,
				head: opts.head?.toString() || null,
			},
		});
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
		return git.stash({ repoPath: this._repoPath, creds: this._intoCreds(data), message: null });
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

	getCommitAuthors(): Promise<git.CommitAuthorInfo[]> {
		return git.getCommitAuthors({ repoPath: this._repoPath });
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

	gc(opts: GcOptions): Promise<void> {
		return git.gc({ repoPath: this._repoPath, opts });
	}
}

export default LibGit2Commands;
