import { RustFs } from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type ReadOnlyFileProvider from "@core/FileProvider/model/ReadOnlyFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import type GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { addScopeToPath } from "@ext/versioning/addScopeToPath";

export default class GitTreeFileProvider implements ReadOnlyFileProvider {
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

	private _mountPath?: Path;

	withMountPath(path: Path) {
		this._mountPath = path;
	}

	async read(path: Path): Promise<string> {
		const [unscoped, fs] = this._fs(path);
		return (await fs.readFile(unscoped.value)).toString();
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		const [unscoped, fs] = this._fs(path);
		try {
			return await fs.readFile(unscoped.value);
		} catch (e) {
			if (e instanceof LibGit2Error && e.code === GitErrorCode.FileNotFoundError) return;
			throw e;
		}
	}

	async readdir(path: Path): Promise<string[]> {
		const [unscoped, fs] = this._fs(path);
		return fs.readDir(unscoped.value);
	}

	async isFolder(path: Path): Promise<boolean> {
		const [unscoped, fs] = this._fs(path);
		const stat = await fs.stat(unscoped.value);
		return stat.isDirectory();
	}

	readlink(): Promise<string> {
		throw new Error("Not implemented");
	}

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

	async exists(path: Path): Promise<boolean> {
		const [unscoped, fs] = this._fs(path);
		return fs.exists(unscoped.value);
	}

	hardlink(): Promise<void> {
		throw new Error("Not implemented");
	}

	async getItems(path: Path): Promise<FileInfo[]> {
		const [unscoped, fs] = this._fs(path);
		const items = await fs.readDirStats(unscoped.value);
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

	isRootPathExists(): Promise<boolean> {
		return Promise.resolve(true);
	}

	private _fs(path: Path): [Path, RustFs] {
		const root = path.rootDirectory;
		const name = root?.nameWithExtension ?? "";
		const repoName = this._git.repoPath.nameWithExtension;
		const scope = this._onlyReadHead ? "HEAD" : GitTreeFileProvider._parseScope(name);
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
		else if ("reference" in scope) scopeValue = scope.reference;
		else if ("commit" in scope) scopeValue = `commit-${scope.commit}`;
		return new Path(addScopeToPath(path.value, encode ? encodeURIComponent(scopeValue) : scopeValue));
	}

	static unscope(scopedPath: Path): { unscoped: Path; scope: TreeReadScope } {
		const scope = this._parseScope(scopedPath.rootDirectory?.nameWithExtension ?? "") ?? "HEAD";
		const idx = scopedPath.value.indexOf(":");
		if (idx === -1) return { unscoped: null, scope: null };

		const beforeIdx = scopedPath.value.slice(0, idx);

		if (scope === "HEAD" || scope === null) {
			return {
				unscoped: new Path(beforeIdx).join(new Path(scopedPath.value.slice(idx + 5)).removeExtraSymbols),
				scope: "HEAD",
			};
		}
		if ("commit" in scope) {
			const commitLength = scope.commit.length;
			return {
				unscoped: new Path(beforeIdx).join(
					new Path(scopedPath.value.slice(idx + commitLength + 8)).removeExtraSymbols,
				),
				scope,
			};
		}
		if ("reference" in scope) {
			const referenceLength = encodeURIComponent(scope.reference).length;
			return {
				unscoped: new Path(beforeIdx).join(
					new Path(scopedPath.value.slice(idx + referenceLength + 1)).removeExtraSymbols,
				),
				scope,
			};
		}
	}

	private static _parseScope(rootName: string): TreeReadScope {
		if (!rootName.includes(":")) return null;
		const data = rootName.split(":").at(-1);
		if (!data || data === "HEAD") return null;
		if (data.startsWith("commit-")) return { commit: decodeURIComponent(data.slice("commit-".length)) };
		return { reference: decodeURIComponent(data) };
	}
}
