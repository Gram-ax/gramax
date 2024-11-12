import type FileInfo from "@core/FileProvider/model/FileInfo";
import type ReadOnlyFileProvider from "@core/FileProvider/model/ReadOnlyFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import GitErrorCode from "@ext/git/core/GitCommands/errors/model/GitErrorCode";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { addGitTreeScopeToPath } from "@ext/versioning/utils";

const decoder = new TextDecoder();

export default class GitTreeFileProvider implements ReadOnlyFileProvider {
	constructor(private readonly _git: GitCommands) {}

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

	withMountPath() {}

	async read(path: Path): Promise<string> {
		const content = await this._git.readFile(...this._resolveScope(path));
		return decoder.decode(content);
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		try {
			const content = await this._git.readFile(...this._resolveScope(path));
			return Buffer.from(content);
		} catch (e) {
			if (e instanceof LibGit2Error && e.code === GitErrorCode.FileNotFoundError) return;
			throw e;
		}
	}

	async readdir(path: Path): Promise<string[]> {
		return (await this._git.readDir(...this._resolveScope(path))).map((e) => e.name);
	}

	async isFolder(path: Path): Promise<boolean> {
		const stat = await this._git.fileStat(...this._resolveScope(path));
		return stat.isDir;
	}

	readlink(): Promise<string> {
		throw new Error("Not implemented");
	}

	async getStat(path: Path): Promise<FileInfo> {
		const stat = await this._git.fileStat(...this._resolveScope(path));
		return {
			name: path.nameWithExtension,
			path,
			size: stat.size,
			isDirectory: () => stat.isDir,
			isFile: () => !stat.isDir,
			isSymbolicLink: () => false,
			ino: 0,
			mode: 0,
			mtimeMs: 0,
			ctimeMs: 0,
			uid: 0,
			gid: 0,
			type: stat.isDir ? "dir" : "file",
		};
	}

	async exists(path: Path): Promise<boolean> {
		return this._git.fileExists(...this._resolveScope(path));
	}

	symlink(): Promise<void> {
		throw new Error("Not implemented");
	}

	async getItems(path: Path): Promise<FileInfo[]> {
		const items = await this._git.readDir(...this._resolveScope(path));
		return Promise.all(items.map(async (item) => this.getStat(path.join(new Path(item.name)))));
	}

	getItemRef(path: Path): ItemRef {
		return { path, storageId: this.storageId };
	}

	isRootPathExists(): Promise<boolean> {
		return Promise.resolve(true);
	}

	static scoped(path: Path, scope: TreeReadScope, omitHead = false): Path {
		if (!path) return Path.empty;
		if (omitHead && !scope) return path;
		let scopeValue: string;
		if (!scope) scopeValue = "HEAD";
		else if ("reference" in scope) scopeValue = scope.reference;
		else if ("commit" in scope) scopeValue = `commit-${scope.commit}`;
		return new Path(addGitTreeScopeToPath(path.value, scopeValue));
	}

	private _resolveScope(path: Path): [Path, TreeReadScope] {
		const root = path.rootDirectory;
		const name = root?.nameWithExtension;
		const data = name?.split(":")?.at(-1);
		let scope: TreeReadScope = null;
		if (name?.includes(":") && data && data !== "HEAD") scope = { reference: decodeURIComponent(data) };
		if (data?.startsWith("commit-")) scope = { commit: decodeURIComponent(data.slice("commit-".length)) };

		return [scope && data ? root.subDirectory(path) : path, scope];
	}
}
