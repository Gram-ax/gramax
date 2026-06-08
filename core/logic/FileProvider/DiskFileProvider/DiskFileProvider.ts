import { getExecutingEnvironment } from "@app/resolveModule/env";
import { EventEmitter } from "@core/Event/EventEmitter";
import { moveToTrash, RustFs } from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import type CompressOptions from "@core/FileProvider/model/CompressOptions";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type { FileProviderEvents } from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { trace, traced } from "@ext/loggers/opentelemetry";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import assert from "assert";

const isDesktop = getExecutingEnvironment() === "tauri";

export default class DiskFileProvider implements FileProvider {
	protected static _events: EventEmitter<FileProviderEvents> = new EventEmitter();
	protected _rootPath: Path;
	protected _mountPath: Path;

	constructor(rootPath: Path | string) {
		if (typeof rootPath === "string") this._rootPath = new Path(rootPath);
		else this._rootPath = rootPath;
	}

	static get events(): EventEmitter<FileProviderEvents> {
		return DiskFileProvider._events;
	}

	get storageId(): string {
		return `Disk@${this.toAbsolute(Path.empty)}`;
	}

	get rootPath(): Path {
		return new Path(this.toAbsolute(Path.empty));
	}

	get isReadOnly(): boolean {
		return false;
	}

	get isFallbackOnRoot(): boolean {
		return false;
	}

	withMountPath(path: Path) {
		this._mountPath = path;
	}

	getItemRef(path: Path): ItemRef {
		return { path, storageId: this.storageId };
	}

	async getItems(path: Path): Promise<FileInfo[]> {
		try {
			const stats = await this._backend().readDirStats(this._rel(path));
			return stats.map((stat) =>
				Object.assign(stat, {
					type: stat.isFile() ? "file" : "dir",
					path: path.join(new Path(stat.name)),
				} as FileInfo),
			);
		} catch {
			return [];
		}
	}

	async isFolder(path: Path): Promise<boolean> {
		if (!(await this.exists(path))) return false;
		const stat = await this._backend().lstat(this._rel(path));
		return stat.isDirectory();
	}

	exists(uri: Path) {
		return this._backend().exists(this._rel(uri));
	}

	@trace()
	async getStat(path: Path, lstat = false): Promise<FileInfo> {
		const stats = await this._backend().stat(this._rel(path), !lstat);
		if (!stats) return null;
		return Object.assign(stats, {
			type: stats.isFile() ? "file" : "dir",
			path: path,
			name: path.nameWithExtension,
		} as FileInfo);
	}

	@trace()
	async delete(path: Path, preferTrash?: boolean) {
		if (preferTrash && isDesktop) {
			try {
				return await moveToTrash(this.toAbsolute(path));
			} catch {}
		}

		if (await this.isFolder(path)) await this._deleteFolder(path);
		else await this._deleteFile(path);
		await DiskFileProvider.events.emit("delete", { path });
	}

	async write(path: Path, data: string | Buffer, compress?: CompressOptions) {
		await traced(
			"DiskFileProvider.write",
			{ args: [path, typeof data === "string" ? data : "<Buffer>", compress] },
			async () => {
				if (!(await this.exists(path.parentDirectoryPath))) {
					await this._backend().makeDir(this._rel(path.parentDirectoryPath), true);
				}
				await this._backend().writeFile(this._rel(path), data, compress);
				await DiskFileProvider.events.emit("write", { path, data });
			},
		);
	}

	async move(from: Path, to: Path, outside?: DiskFileProvider) {
		if (outside) {
			await RustFs.disk("").mv(this.toAbsolute(from), outside.toAbsolute(to));
		} else {
			await this._backend().mv(this._rel(from), this._rel(to));
		}
		await DiskFileProvider.events.emit("move", { from, to });
	}

	async copy(from: Path, to: Path) {
		if (await this.isFolder(from)) await this._copyFolder(from, to);
		else await this._copyFile(from, to);
		await DiskFileProvider.events.emit("copy", { from, to });
	}

	async mkdir(path: Path, _mode?: number) {
		if (!(await this.exists(path))) await this._backend().makeDir(this._rel(path), true);
	}

	async read(path: Path): Promise<string> {
		return (await this._backend().readFile(this._rel(path))).toString();
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		try {
			return await this._backend().readFile(this._rel(path));
		} catch (e: unknown) {
			const err = e as { name?: string; code?: string };
			if (
				err?.name === "ENOENT" ||
				err?.code === "ENOENT" ||
				err?.name === "NotFound" ||
				err?.code === "NotFound"
			)
				return;
			throw e;
		}
	}

	async readdir(path: Path): Promise<string[]> {
		return this._backend().readDir(this._rel(path));
	}

	async readlink(path: Path): Promise<string> {
		return this._backend().readLink(this._rel(path));
	}

	async hardlink(target: Path, path: Path): Promise<void> {
		await this._backend().makeSymlink(this._rel(target), this._rel(path));
	}

	@trace()
	async deleteEmptyDirs(folderPath: Path) {
		await this._backend().deleteEmptyDirs(this._rel(folderPath));
	}

	watch(_: (changeItems: ItemRefStatus[]) => void) {}

	stopWatch() {}

	startWatch() {}

	async createRootPathIfNeed() {
		if (await this.exists(Path.empty)) return;
		return await this.mkdir(Path.empty);
	}

	async isRootPathExists() {
		try {
			await this.readdir(Path.empty);
			return true;
		} catch (e: unknown) {
			const err = e as { name?: string; code?: string };
			if (
				err?.name === "ENOENT" ||
				err?.code === "ENOENT" ||
				err?.name === "NotFound" ||
				err?.code === "NotFound"
			)
				return false;
			throw new Error(`Root path ${this._rootPath.value} not exist`, { cause: e });
		}
	}

	toAbsolute(path: Path): string {
		let targetPath = path;
		assert(this._mountPath || this._rootPath, "Mount path or root path are not set");

		if (this._mountPath && this._rootPath.value !== Path.empty.value) {
			const index = path.value.indexOf("/");
			targetPath = index > 0 ? new Path(path.value.slice(index + 1)) : Path.empty;
		}

		if (this._mountPath) {
			if (this._rootPath) return this._mountPath.join(this._rootPath, targetPath).value;
			return this._mountPath.join(targetPath).value;
		}

		return this._rootPath ? this._rootPath.join(targetPath).value : targetPath.value;
	}

	private _backend(): RustFs {
		return RustFs.disk(this.toAbsolute(Path.empty));
	}

	private _rel(path: Path): string {
		if (this._mountPath && this._rootPath.value !== Path.empty.value) {
			const index = path.value.indexOf("/");
			return index > 0 ? path.value.slice(index + 1) : "";
		}
		const v = path.value;
		if (this._rootPath.value === Path.empty.value) return v;
		return v.startsWith("/") ? v.slice(1) : v;
	}

	private async _deleteFile(path: Path) {
		if (!(await this.exists(path))) return;
		await this._backend().rmfile(this._rel(path));
	}

	private async _deleteFolder(uri: Path) {
		if (!(await this.exists(uri))) return;
		await this._backend().removeDir(this._rel(uri), true);
	}

	private async _copyFolder(oldPath: Path, newPath: Path) {
		await this._backend().copy(this._rel(oldPath), this._rel(newPath));
	}

	private async _copyFile(oldFilePath: Path, newFilePath: Path) {
		const content = await this.readAsBinary(oldFilePath);
		if (!(await this.exists(oldFilePath))) return;
		await this.write(newFilePath, content);
	}
}
