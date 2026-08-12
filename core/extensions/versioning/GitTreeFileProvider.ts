import { type FsScope, RustFs } from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type ReadOnlyFileProvider from "@core/FileProvider/model/ReadOnlyFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import type GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { Level, trace } from "@ext/loggers/opentelemetry";
import { addScopeToPath } from "@ext/versioning/addScopeToPath";
import { GitTreeScopeParser } from "@ext/versioning/GitTreeScopeParser";

export default class GitTreeFileProvider implements ReadOnlyFileProvider {
	private _mountPath?: Path;

	constructor(
		private readonly _git: GitCommands,
		private readonly _onlyReadHead = false,
	) {}

	get storageId(): string {
		return `GitTree@${this._git.repoPath.value}`;
	}

	get rootPath(): Path {
		return this._git.repoPath;
	}

	get isReadOnly(): boolean {
		return true;
	}

	get isFallbackOnRoot(): boolean {
		return true;
	}

	get kind(): "git" | "disk" {
		return "git";
	}

	withMountPath(path: Path) {
		this._mountPath = path;
	}

	@trace({ level: Level.Full })
	async read(path: Path): Promise<string> {
		const [unscoped, fs] = this._fs(path);
		return (await fs.readFile(unscoped.value)).toString();
	}

	@trace({ level: Level.Full })
	async readAsBinary(path: Path): Promise<Buffer> {
		const [unscoped, fs] = this._fs(path);
		try {
			return await fs.readFile(unscoped.value);
		} catch (e) {
			if (e instanceof LibGit2Error && e.code === GitErrorCode.FileNotFoundError) return;
			throw e;
		}
	}

	@trace({ level: Level.Full })
	async readdir(path: Path): Promise<string[]> {
		const [unscoped, fs] = this._fs(path);
		try {
			return await fs.readDir(unscoped.value);
		} catch (e) {
			if (GitTreeFileProvider._isMissingInTree(e)) return [];
			throw e;
		}
	}

	@trace({ level: Level.Full })
	async isFolder(path: Path): Promise<boolean> {
		const [unscoped, fs] = this._fs(path);
		const stat = await fs.stat(unscoped.value);
		return stat.isDirectory();
	}

	readlink(): Promise<string> {
		throw new Error("Not implemented");
	}

	@trace({ level: Level.Full })
	async getStat(path: Path): Promise<FileInfo> {
		const [unscoped, fs] = this._fs(path);
		const stat = await fs.stat(unscoped.value);
		return {
			name: path.nameWithExtension,
			path,
			size: stat.size,
			isDirectory: () => stat.isDirectory(),
			isFile: () => stat.isFile(),
			isSymbolicLink: () => false,
			ino: 0,
			mode: 0,
			mtimeMs: 0,
			ctimeMs: 0,
			uid: 0,
			gid: 0,
			type: stat.isDirectory() ? "dir" : "file",
		};
	}

	@trace({ level: Level.Full })
	async exists(path: Path): Promise<boolean> {
		const [unscoped, fs] = this._fs(path);
		return fs.exists(unscoped.value);
	}

	hardlink(): Promise<void> {
		throw new Error("Not implemented");
	}

	@trace({ level: Level.Full })
	async getItems(path: Path): Promise<FileInfo[]> {
		const [unscoped, fs] = this._fs(path);
		let items: Awaited<ReturnType<typeof fs.readDirStats>>;
		try {
			items = await fs.readDirStats(unscoped.value);
		} catch (e) {
			if (GitTreeFileProvider._isMissingInTree(e)) return [];
			throw e;
		}
		return items.map((stat) => ({
			name: stat.name,
			path: path.join(new Path(stat.name)),
			size: stat.size,
			isDirectory: () => stat.isDirectory(),
			isFile: () => stat.isFile(),
			isSymbolicLink: () => false,
			ino: 0,
			mode: 0,
			mtimeMs: 0,
			ctimeMs: 0,
			uid: 0,
			gid: 0,
			type: stat.isDirectory() ? "dir" : "file",
		}));
	}

	getItemRef(path: Path): ItemRef {
		return { path, storageId: this.storageId };
	}

	@trace({ level: Level.Full })
	isRootPathExists(): Promise<boolean> {
		return Promise.resolve(true);
	}

	/**
	 * Native (Rust) scope + tree-relative path for `path`, mirroring how this provider's own
	 * reads are dispatched. Lets callers run native `fs.*` commands (e.g. `fs.scan_catalog`)
	 * directly against the git tree instead of hand-rolling an `FsScope`.
	 */
	getNativeScope(path: Path): { scope: FsScope; scopedPath: string } {
		const [stripped, fs] = this._fs(path);
		return { scope: fs.scope, scopedPath: stripped.value };
	}

	private _fs(path: Path): [Path, RustFs] {
		const root = path.rootDirectory;
		const name = root?.nameWithExtension ?? "";
		const repoName = this._git.repoPath.nameWithExtension;
		const parsedScope = this._onlyReadHead ? "HEAD" : GitTreeFileProvider._parseScope(name);
		const scope =
			parsedScope && typeof parsedScope === "object" && "oldCommit" in parsedScope
				? parsedScope.newCommit
				: parsedScope;
		const matchesRepo = name.startsWith(repoName) && (!name[repoName.length] || name[repoName.length] === ":");
		const matchesMount = this._mountPath && name === this._mountPath.nameWithExtension;
		const shouldStripRoot = name.includes(":") || matchesRepo || matchesMount;
		const stripped = shouldStripRoot ? (root.subDirectory(path) ?? Path.empty) : path;
		return [stripped, RustFs.git(this._git.absoluteRepoPath.value, scope ?? "HEAD")];
	}

	static scoped(path: Path, scope: TreeReadScope, omitHead = false, encode = false): Path {
		if (!path) return Path.empty;
		if (omitHead && !scope) return path;
		let scopeValue: string;
		if (!scope || scope === "HEAD") scopeValue = "HEAD";
		else if ("oldCommit" in scope) scopeValue = `dif-${scope.oldCommit.commit}-${scope.newCommit.commit}`;
		else if ("reference" in scope) scopeValue = scope.reference;
		else if ("commit" in scope) scopeValue = `commit-${scope.commit}`;
		return new Path(addScopeToPath(path.value, encode ? encodeURIComponent(scopeValue) : scopeValue));
	}

	/**
	 * A directory read against a git tree that does not contain the path (e.g. a diff scope on a commit
	 * that predates the catalog folder) makes libgit2 raise "does not exist in the given tree". This is a
	 * read-only tree, so an absent directory should list as empty, not throw. The Node backend surfaces
	 * this as a {@link LibGit2Error} (`FileNotFoundError`); the browser/wasm backend wraps it as a plain
	 * `IoError`, so also match the message.
	 */
	private static _isMissingInTree(e: unknown): boolean {
		if (e instanceof LibGit2Error) return e.code === GitErrorCode.FileNotFoundError;
		return e instanceof Error && e.message.includes("does not exist in the given tree");
	}

	private static _parseScope(rootName: string): TreeReadScope {
		if (!rootName.includes(":")) return null;
		const data = rootName.split(":").at(-1);
		if (!data || data === "HEAD") return null;
		const parsed = GitTreeScopeParser.parse(decodeURIComponent(data));
		return parsed === "HEAD" ? null : parsed;
	}
}
