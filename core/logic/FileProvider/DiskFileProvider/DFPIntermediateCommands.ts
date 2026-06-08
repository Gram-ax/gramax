import resolveModule from "@app/resolveModule/backend";
import rustCall from "@app/resolveModule/rustcall";
import type CompressOptions from "@core/FileProvider/model/CompressOptions";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { Buffer } from "buffer";

export type DirStatRaw = { name: string } & FileInfo;

type StatExt = { isDirectory: () => boolean; isFile: () => boolean; isSymbolicLink: () => boolean };

export type Stat = FileInfo & StatExt;
export type DirStat = DirStatRaw & StatExt;

export type FsScope = { kind: "disk"; root: string } | { kind: "git"; repo: string; scope: TreeReadScope };

const decorate = <T extends FileInfo>(stat: T): T & StatExt =>
	Object.assign(stat, {
		isDirectory: () => stat.type === "dir",
		isFile: () => stat.type === "file",
		isSymbolicLink: () => false,
	});

export class RustFs {
	constructor(private readonly _scope: FsScope) {}

	static disk(root: string): RustFs {
		return new RustFs({ kind: "disk", root });
	}

	static git(repo: string, scope: TreeReadScope): RustFs {
		return new RustFs({ kind: "git", repo, scope });
	}

	get scope(): FsScope {
		return this._scope;
	}

	exists(path: string): Promise<boolean> {
		return rustCall<boolean>("fs.exists", { scope: this._scope, path });
	}

	async stat(path: string, followLink = false): Promise<Stat> {
		const res = await rustCall<FileInfo>("fs.getstat", { scope: this._scope, path, followLink });
		return decorate(res);
	}

	lstat(path: string): Promise<Stat> {
		return this.stat(path, true);
	}

	async readFile(path: string): Promise<Buffer> {
		return Buffer.from(await rustCall("fs.read_file", { scope: this._scope, path }));
	}

	readDir(path: string): Promise<string[]> {
		return rustCall<string[]>("fs.read_dir", { scope: this._scope, path });
	}

	async readDirStats(path: string): Promise<DirStat[]> {
		const stats = await rustCall<DirStatRaw[]>("fs.read_dir_stats", { scope: this._scope, path });
		return stats.map(decorate) as DirStat[];
	}

	readLink(path: string): Promise<string> {
		return rustCall<string>("fs.read_link", { scope: this._scope, path });
	}

	writeFile(path: string, content: string | Buffer, compress?: CompressOptions): Promise<void> {
		return rustCall<void>("fs.write_file", { scope: this._scope, path, content, compress });
	}

	mv(from: string, to: string): Promise<void> {
		return rustCall<void>("fs.mv", { scope: this._scope, from, to });
	}

	copy(from: string, to: string): Promise<void> {
		return rustCall<void>("fs.copy", { scope: this._scope, from, to });
	}

	makeDir(path: string, recursive = false): Promise<void> {
		return rustCall<void>("fs.make_dir", { scope: this._scope, path, recursive });
	}

	removeDir(path: string, recursive = false): Promise<void> {
		return rustCall<void>("fs.remove_dir", { scope: this._scope, path, recursive });
	}

	rmfile(path: string): Promise<void> {
		return rustCall<void>("fs.rmfile", { scope: this._scope, path });
	}

	makeSymlink(from: string, to: string): Promise<void> {
		return rustCall<void>("fs.hardlink", { scope: this._scope, from, to });
	}

	deleteEmptyDirs(path: string): Promise<void> {
		return rustCall<void>("fs.delete_empty_dirs", { scope: this._scope, path });
	}

	async rm(path: string, opts?: { recursive?: boolean; force?: boolean }): Promise<void> {
		try {
			const stats = await this.stat(path, false);
			if (stats.isFile()) await this.rmfile(path);
			else await this.removeDir(path, opts?.recursive);
		} catch (err) {
			if (!opts?.force) throw err;
		}
	}
}

export const moveToTrash = (path: string) => resolveModule("moveToTrash")(path);
