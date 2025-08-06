// In tauri we replace fs-extra with TauriFs(tauri/vite.config.ts); in wasm with wasmfs
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { EventEmitter } from "@core/Event/EventEmitter";
import type * as DFPIntermediateCommands from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import FileInfo from "@core/FileProvider/model/FileInfo";
import FileProvider, { FileProviderEvents } from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import Watcher from "@ext/Watchers/model/Watcher";
import assert from "assert";
import * as fs from "fs-extra";

const isDesktop = getExecutingEnvironment() == "tauri";

export type DiskFileProviderOptions = {
	watcher?: Watcher;
};

export default class DiskFileProvider implements FileProvider {
	protected static _events: EventEmitter<FileProviderEvents> = new EventEmitter();
	protected _rootPath: Path;
	protected _mountPath: Path;
	private _watcher: Watcher;

	constructor(rootPath: Path | string, options: DiskFileProviderOptions = {}) {
		if (typeof rootPath === "string") this._rootPath = new Path(rootPath);
		else this._rootPath = rootPath;

		this._watcher = options.watcher;
		this._watcher?.init(this);
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
		// In nodejs, custom fs implementation is not used; This if is essentially an optimization of command call count
		if (getExecutingEnvironment() === "browser" || getExecutingEnvironment() === "tauri") {
			const stats = await (fs as unknown as typeof DFPIntermediateCommands).readDirStats(this.toAbsolute(path));
			return stats.map((stat) =>
				Object.assign(stat, {
					type: (stat.isFile() ? "file" : "dir") as any,
					path: path.join(new Path(stat.name)),
				} as FileInfo),
			);
		}

		try {
			const files = await fs.readdir(this.toAbsolute(path));
			return (
				await Promise.all(
					files.map(async (name): Promise<FileInfo> => {
						const itemPath = path.join(new Path(name));
						try {
							return await this.getStat(itemPath, true);
						} catch {}
					}),
				)
			).filter((u) => u);
		} catch {
			return [];
		}
	}

	async isFolder(path: Path): Promise<boolean> {
		if (!(await this.exists(path))) return false;
		return await fs.lstat(this.toAbsolute(path)).then((stat) => {
			return stat.isDirectory();
		});
	}

	exists(uri: Path) {
		return fs.exists(this.toAbsolute(uri));
	}

	async getStat(path: Path, lstat = false): Promise<FileInfo> {
		const stats = lstat ? await fs.lstat(this.toAbsolute(path)) : await fs.stat(this.toAbsolute(path));
		if (!stats) return null;
		return Object.assign(stats, {
			type: (stats.isFile() ? "file" : "dir") as any,
			path: path,
			name: path.nameWithExtension,
		} as FileInfo);
	}

	async delete(path: Path, preferTrash?: boolean) {
		if (preferTrash && isDesktop) {
			try {
				return await (fs as any).moveToTrash(this.toAbsolute(path));
			} catch {}
		}

		if (await this.isFolder(path)) await this._deleteFolder(path);
		else await this._deleteFile(path);
		await DiskFileProvider.events.emit("delete", { path });
	}

	async write(path: Path, data: string | Buffer) {
		this._watcher?.stop();
		try {
			const absolutePath = this.toAbsolute(path);
			if (await this.exists(path.parentDirectoryPath)) await fs.writeFile(absolutePath, data as any);
			else {
				await fs.mkdir(this.toAbsolute(path.parentDirectoryPath), { recursive: true });
				await fs.writeFile(absolutePath, data as any);
			}
			await DiskFileProvider.events.emit("write", { path, data });
		} finally {
			this._watcher?.start();
		}
	}

	async move(from: Path, to: Path) {
		await fs.move(this.toAbsolute(from), this.toAbsolute(to));
		await DiskFileProvider.events.emit("move", { from, to });
	}

	async copy(from: Path, to: Path) {
		if (await this.isFolder(from)) await this._copyFolder(from, to);
		else await this._copyFile(from, to);
		await DiskFileProvider.events.emit("copy", { from, to });
	}

	async mkdir(path: Path, mode?: number) {
		this._watcher?.stop();
		try {
			const absolutPath = this.toAbsolute(path);
			if (!(await this.exists(path))) await fs.mkdir(absolutPath, { recursive: true, mode });
		} finally {
			this._watcher?.start();
		}
	}

	async read(path: Path): Promise<string> {
		return (await fs.readFile(this.toAbsolute(path))).toString();
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		try {
			return await fs.readFile(this.toAbsolute(path));
		} catch (e) {
			if (e.name == "ENOENT" || e.code == "ENOENT") return;
			throw e;
		}
	}

	async readdir(path: Path): Promise<string[]> {
		return fs.readdir(this.toAbsolute(path));
	}

	async readlink(path: Path): Promise<string> {
		return fs.readlink(this.toAbsolute(path));
	}

	async symlink(target: Path, path: Path): Promise<void> {
		await fs.symlink(this.toAbsolute(target), this.toAbsolute(path));
	}

	async deleteEmptyFolders(folderPath: Path) {
		const items = await this.getItems(folderPath);
		await Promise.all(
			items.map(async (item) => {
				if (item.isDirectory()) {
					if (await this._isEmptyFolder(item.path)) await this.delete(item.path);
					else await this.deleteEmptyFolders(item.path);
				}
			}),
		);
	}

	watch(callback: (changeItems: ItemRefStatus[]) => void) {
		this._watcher?.watch(callback);
	}

	stopWatch() {
		this._watcher?.stop();
	}

	startWatch() {
		this._watcher?.start();
	}

	async createRootPathIfNeed() {
		if (await this.exists(Path.empty)) return;
		return await this.mkdir(Path.empty);
	}

	async isRootPathExists() {
		try {
			await this.readdir(Path.empty);
			return true;
		} catch (e) {
			if (e.name == "ENOENT" || e.code == "ENOENT") return false;
			throw new Error(`Root path ${this._rootPath.value} not exist`, e);
		}
	}

	toAbsolute(path: Path): string {
		assert(this._mountPath || this._rootPath, "Mount path or root path are not set");

		// If the root path is not empty and mount path is specified, we need to remove first component of path
		// This is needed in cases when we using a virtual path, like 'catalog:tag'
		// If we don't remove first component, we will get '/mnt/dir/catalog:tag/catalog/...'
		if (this._mountPath && this._rootPath.value != Path.empty.value) {
			const index = path.value.indexOf("/");
			path = index > 0 ? new Path(path.value.slice(index + 1)) : Path.empty;
		}

		if (this._mountPath) {
			if (this._rootPath) return this._mountPath.join(this._rootPath, path).value;
			return this._mountPath.join(path).value;
		}

		return this._rootPath ? this._rootPath.join(path).value : path.value;
	}

	private async _deleteFile(path: Path) {
		if (!(await this.exists(path))) return;
		this._watcher?.stop();
		try {
			await fs.unlink(this.toAbsolute(path));
		} finally {
			this._watcher?.start();
		}
	}

	private async _deleteFolder(uri: Path) {
		const path = this.toAbsolute(uri);
		if (!(await fs.exists(path))) return;
		this._watcher?.stop();
		try {
			await fs.rm(path, { recursive: true, force: true });
		} finally {
			this._watcher?.start();
		}
	}

	private async _copyFolder(oldPath: Path, newPath: Path) {
		this._watcher?.stop();
		try {
			await fs.copy(this.toAbsolute(oldPath), this.toAbsolute(newPath));
		} finally {
			this._watcher?.start();
		}
	}

	private async _copyFile(oldFilePath: Path, newFilePath: Path) {
		this._watcher?.stop();
		try {
			const content = await this.readAsBinary(oldFilePath);
			if (!(await this.exists(oldFilePath))) return;
			await this.write(newFilePath, content);
		} finally {
			this._watcher?.start();
		}
	}

	private async _isEmptyFolder(path: Path) {
		if (await this.exists(path)) return (await this.readdir(path)).length === 0;
	}
}
