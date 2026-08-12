import { getExecutingEnvironment } from "@app/resolveModule/env";
import { EventEmitter } from "@core/Event/EventEmitter";
import { moveToTrash, RustFs } from "@core/FileProvider/DiskFileProvider/DFPIntermediateCommands";
import type CompressOptions from "@core/FileProvider/model/CompressOptions";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type { FileProviderEvents } from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { Level, span, trace, traced } from "@ext/loggers/opentelemetry";
import { broadcastFsEvent } from "@ext/Watchers/FsEventBroadcaster";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import { PendingSelfWrites } from "@ext/Watchers/PendingSelfWrites";
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

	get kind(): "git" | "disk" {
		return "disk";
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

	@trace({ level: Level.Full })
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

	@trace({ level: Level.Full })
	async isFolder(path: Path): Promise<boolean> {
		if (!(await this.exists(path))) return false;
		const stat = await this._backend().lstat(this._rel(path));
		return stat.isDirectory();
	}

	@trace({ level: Level.Full })
	exists(uri: Path) {
		return this._backend().exists(this._rel(uri));
	}

	@trace({ level: Level.Full })
	async getStat(path: Path, lstat = false): Promise<FileInfo> {
		const stats = await this._backend().stat(this._rel(path), !lstat);
		if (!stats) return null;
		return Object.assign(stats, {
			type: stats.isFile() ? "file" : "dir",
			path: path,
			name: path.nameWithExtension,
		} as FileInfo);
	}

	@trace({ level: Level.Files })
	async delete(path: Path, preferTrash?: boolean) {
		span()?.addEvent("disk-file-provider-delete", {
			path: path.value,
			preferTrash: Boolean(preferTrash),
			stack: new Error().stack ?? "",
		});

		if (preferTrash && isDesktop) {
			try {
				return await moveToTrash(this.toAbsolute(path));
			} catch {}
		}

		if (await this.isFolder(path)) await this._deleteFolder(path);
		else await this._deleteFile(path);
		PendingSelfWrites.mark(this.toAbsolute(path));
		broadcastFsEvent({ relPath: path.value, kind: { type: "removed" } });
		await DiskFileProvider.events.emit("delete", { path });
	}

	@trace({ level: Level.Files })
	async write(path: Path, data: string | Buffer, compress?: CompressOptions) {
		await traced(
			"DiskFileProvider.write",
			{ level: Level.Files, args: [path, typeof data === "string" ? data : "<Buffer>", compress] },
			async () => {
				if (!(await this.exists(path.parentDirectoryPath))) {
					await this._backend().makeDir(this._rel(path.parentDirectoryPath), true);
				}
				await this._backend().writeFile(this._rel(path), data, compress);
				PendingSelfWrites.mark(this.toAbsolute(path));
				broadcastFsEvent({ relPath: path.value, kind: { type: "modified" } });
				await DiskFileProvider.events.emit("write", { path, data });
			},
		);
	}

	@trace({ level: Level.Files })
	async move(from: Path, to: Path, outside?: DiskFileProvider) {
		span()?.addEvent("disk-file-provider-move", {
			from: from.value,
			to: to.value,
			outside: Boolean(outside),
			stack: new Error().stack ?? "",
		});

		if (outside) {
			await RustFs.disk("").mv(this.toAbsolute(from), outside.toAbsolute(to));
			PendingSelfWrites.mark(this.toAbsolute(from));
			PendingSelfWrites.mark(outside.toAbsolute(to));
		} else {
			await this._backend().mv(this._rel(from), this._rel(to));
			PendingSelfWrites.mark(this.toAbsolute(from));
			PendingSelfWrites.mark(this.toAbsolute(to));
		}
		broadcastFsEvent({ relPath: to.value, kind: { type: "renamed", from: from.value } });
		await DiskFileProvider.events.emit("move", { from, to });
	}

	@trace({ level: Level.Files })
	async copy(from: Path, to: Path) {
		if (await this.isFolder(from)) await this._copyFolder(from, to);
		else await this._copyFile(from, to);
		PendingSelfWrites.mark(this.toAbsolute(to));
		broadcastFsEvent({ relPath: to.value, kind: { type: "created" } });
		await DiskFileProvider.events.emit("copy", { from, to });
	}

	@trace({ level: Level.Files })
	async mkdir(path: Path, _mode?: number) {
		if (!(await this.exists(path))) await this._backend().makeDir(this._rel(path), true);
		PendingSelfWrites.mark(this.toAbsolute(path));
		broadcastFsEvent({ relPath: path.value, kind: { type: "created" } });
	}

	@trace({ level: Level.Full })
	async read(path: Path): Promise<string> {
		return (await this._backend().readFile(this._rel(path))).toString();
	}

	@trace({ level: Level.Full })
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

	@trace({ level: Level.Full })
	async readdir(path: Path): Promise<string[]> {
		return this._backend().readDir(this._rel(path));
	}

	@trace({ level: Level.Full })
	async readlink(path: Path): Promise<string> {
		return this._backend().readLink(this._rel(path));
	}

	@trace({ level: Level.Files })
	async hardlink(target: Path, path: Path): Promise<void> {
		await this._backend().makeSymlink(this._rel(target), this._rel(path));
	}

	@trace({ level: Level.Files })
	async deleteEmptyDirs(folderPath: Path) {
		await this._backend().deleteEmptyDirs(this._rel(folderPath));
		PendingSelfWrites.mark(this.toAbsolute(folderPath));
		broadcastFsEvent({ relPath: folderPath.value, kind: { type: "removed" } });
	}

	watch(_: (changeItems: ItemRefStatus[]) => void) {}

	stopWatch() {}

	startWatch() {}

	@trace({ level: Level.Files })
	async createRootPathIfNeed() {
		if (await this.exists(Path.empty)) return;
		return await this.mkdir(Path.empty);
	}

	@trace({ level: Level.Full })
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
