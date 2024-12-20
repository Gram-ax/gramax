// в tauri заменяем fs-extra на TauriFs(tauri/vite.config.ts); в wasm на wasmfs
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import * as fs from "fs-extra";
import { type ItemRefStatus } from "../../../extensions/Watchers/model/ItemStatus";
import Watcher from "../../../extensions/Watchers/model/Watcher";
import Path from "../Path/Path";
import FileInfo from "../model/FileInfo";
import FileProvider from "../model/FileProvider";
import type * as DFPIntermediateCommands from "./DFPIntermediateCommands";

const isDesktop = getExecutingEnvironment() == "tauri";

export default class DiskFileProvider implements FileProvider {
	private _rootPath: Path;
	private _mountPath: Path;

	constructor(rootPath: Path | string, private _watcher?: Watcher) {
		if (typeof rootPath === "string") this._rootPath = new Path(rootPath);
		else this._rootPath = rootPath;
		_watcher?.init(this);
	}

	get storageId(): string {
		return `Disk@${this._toAbsolute(Path.empty)}`;
	}

	get rootPath(): Path {
		return new Path(this._toAbsolute(Path.empty));
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
		// В next не используется кастомная реализация fs; По сути этот if - оптимизация количества вызовов команд
		if (getExecutingEnvironment() != "next") {
			const stats = await (fs as unknown as typeof DFPIntermediateCommands).readDirStats(this._toAbsolute(path));
			return stats.map((stat) =>
				Object.assign(stat, {
					type: (stat.isFile() ? "file" : "dir") as any,
					path: path.join(new Path(stat.name)),
				} as FileInfo),
			);
		}

		try {
			const files = await fs.readdir(this._toAbsolute(path));
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
		return await fs.lstat(this._toAbsolute(path)).then((stat) => {
			return stat.isDirectory();
		});
	}

	exists(uri: Path) {
		return fs.exists(this._toAbsolute(uri));
	}

	async getStat(path: Path, lstat = false): Promise<FileInfo> {
		const stats = lstat ? await fs.lstat(this._toAbsolute(path)) : await fs.stat(this._toAbsolute(path));
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
				return await (fs as any).moveToTrash(this._toAbsolute(path));
			} catch {}
		}

		if (await this.isFolder(path)) await this._deleteFolder(path);
		else await this._deleteFile(path);
	}

	async write(path: Path, data: string | Buffer) {
		this._watcher?.stop();
		try {
			const absolutePath = this._toAbsolute(path);
			if (await this.exists(path.parentDirectoryPath)) await fs.writeFile(absolutePath, data);
			else {
				await fs.mkdir(this._toAbsolute(path.parentDirectoryPath), { recursive: true });
				await fs.writeFile(absolutePath, data);
			}
		} finally {
			this._watcher?.start();
		}
	}

	async move(from: Path, to: Path) {
		await fs.move(this._toAbsolute(from), this._toAbsolute(to));
	}

	async copy(from: Path, to: Path) {
		if (await this.isFolder(from)) await this._copyFolder(from, to);
		else await this._copyFile(from, to);
	}

	async mkdir(path: Path, mode?: number) {
		this._watcher?.stop();
		try {
			const absolutPath = this._toAbsolute(path);
			if (!(await this.exists(path))) await fs.mkdir(absolutPath, { recursive: true, mode });
		} finally {
			this._watcher?.start();
		}
	}

	async read(path: Path): Promise<string> {
		return (await fs.readFile(this._toAbsolute(path))).toString();
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		try {
			return await fs.readFile(this._toAbsolute(path));
		} catch (e) {
			if (e.name == "ENOENT" || e.code == "ENOENT") return;
			throw e;
		}
	}

	async readdir(path: Path): Promise<string[]> {
		return fs.readdir(this._toAbsolute(path));
	}

	async readlink(path: Path): Promise<string> {
		return fs.readlink(this._toAbsolute(path));
	}

	async symlink(target: Path, path: Path): Promise<void> {
		await fs.symlink(this._toAbsolute(target), this._toAbsolute(path));
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

	private async _deleteFile(path: Path) {
		if (!(await this.exists(path))) return;
		this._watcher?.stop();
		try {
			await fs.unlink(this._toAbsolute(path));
		} finally {
			this._watcher?.start();
		}
	}

	private async _deleteFolder(uri: Path) {
		const path = this._toAbsolute(uri);
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
			await fs.copy(this._toAbsolute(oldPath), this._toAbsolute(newPath));
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

	private _toAbsolute(path: Path): string {
		if (!this._mountPath && !this._rootPath) throw new Error("Mount path nor root path are not set");

		if (this._mountPath) {
			if (this._rootPath) return this._mountPath.join(this._rootPath, path).value;
			return this._mountPath.join(path).value;
		}

		return this._rootPath ? this._rootPath.join(path).value : path.value;
	}
}
