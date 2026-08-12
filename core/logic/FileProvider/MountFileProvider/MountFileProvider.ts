import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import type CompressOptions from "@core/FileProvider/model/CompressOptions";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type ReadOnlyFileProvider from "@core/FileProvider/model/ReadOnlyFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { Level, trace } from "@ext/loggers/opentelemetry";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";

export default class MountFileProvider implements FileProvider {
	private readonly _rootPath: Path;
	private readonly _mounts = new Map<string, FileProvider | ReadOnlyFileProvider>();

	constructor(rootPath: Path) {
		this._rootPath = rootPath;
	}

	get kind(): "git" | "disk" {
		return this.default().kind;
	}

	get storageId(): string {
		return this._mounts.get("/")?.storageId;
	}

	get rootPath(): Path {
		return this._rootPath;
	}

	get isReadOnly(): boolean {
		return true;
	}

	get isFallbackOnRoot(): boolean {
		return true;
	}

	static fromDefault(root: Path) {
		return new this(root).mount(Path.empty, new DiskFileProvider(Path.empty));
	}

	allFp(): Readonly<Map<string, FileProvider | ReadOnlyFileProvider>> {
		return this._mounts;
	}

	at(path: Path): FileProvider | ReadOnlyFileProvider {
		return this._resolveFileProvider(path, false, false);
	}

	withMountPath() {
		throw new Error("Not supported");
	}

	default() {
		const mount = this._mounts.get("/");
		if (!mount) throw new Error("Root mount not found");
		return mount as FileProvider;
	}

	reset() {
		const fp = this.default();
		this._mounts.clear();
		this._mounts.set("/", fp);
		return this;
	}

	@trace({ level: Level.Files })
	mount(mountpoint: Path, fp: FileProvider | ReadOnlyFileProvider, useParentPath?: boolean) {
		if ((!mountpoint?.value || mountpoint?.value === "/") && fp.isReadOnly)
			throw new Error("Read-only FileProvider cannot be mounted as root");

		const mountPath = useParentPath
			? this._rootPath.join(mountpoint).parentDirectoryPath
			: this._rootPath.join(mountpoint);

		fp.withMountPath(mountPath);
		this._mounts.set(mountpoint?.value || "/", fp);
		return this;
	}

	@trace({ level: Level.Files })
	unmount(mountpoint: Path) {
		const fp = this._mounts.get(mountpoint.value);
		if (fp) fp.withMountPath(null);
		this._mounts.delete(mountpoint.value);
		return this;
	}

	private _resolveFileProvider<W extends boolean>(
		path: Path,
		writeable: W,
		shouldFallbackOnRoot = false,
	): W extends true ? FileProvider : ReadOnlyFileProvider {
		if (this._mounts.size === 1)
			return this._mounts.get("/") as W extends true ? FileProvider : ReadOnlyFileProvider;

		const validatedPath = path || Path.empty;
		const currentPath = validatedPath.value;
		let lastSlashIndex =
			shouldFallbackOnRoot && this.isFallbackOnRoot
				? validatedPath.parentDirectoryPath.value.length
				: currentPath.length;

		while (lastSlashIndex > 0) {
			const provider = this._mounts.get(currentPath.slice(0, lastSlashIndex) || "/");
			if (provider) {
				if (writeable && provider.isReadOnly)
					throw new Error(
						`Requested writable FileProvider but found read-only ${provider.storageId} at ${currentPath}`,
					);
				return provider as W extends true ? FileProvider : ReadOnlyFileProvider;
			}

			lastSlashIndex = currentPath.lastIndexOf("/", lastSlashIndex - 1);
		}

		const mount = this._mounts.get("/");
		if (!mount) throw new Error("Root mount not found");
		return mount as FileProvider;
	}

	@trace({ level: Level.Files })
	delete(path: Path, preferTrash?: boolean): Promise<void> {
		return this._resolveFileProvider(path, true, true).delete(path, preferTrash);
	}

	@trace({ level: Level.Files })
	deleteEmptyDirs(path: Path): Promise<void> {
		return this._resolveFileProvider(path, true, false).deleteEmptyDirs(path);
	}

	@trace({ level: Level.Files })
	write(path: Path, data: string | Buffer, compress?: CompressOptions): Promise<void> {
		return this._resolveFileProvider(path, true).write(path, data, compress);
	}

	@trace({ level: Level.Files })
	move(from: Path, to: Path): Promise<void> {
		return this._resolveFileProvider(from, true, true).move(from, to);
	}

	@trace({ level: Level.Files })
	copy(from: Path, to: Path): Promise<void> {
		return this._resolveFileProvider(from, true, true).copy(from, to);
	}

	@trace({ level: Level.Files })
	mkdir(path: Path, mode?: number): Promise<void> {
		return this._resolveFileProvider(path, true).mkdir(path, mode);
	}

	@trace({ level: Level.Files })
	createRootPathIfNeed(): Promise<void> {
		return this._resolveFileProvider(this._rootPath, true).createRootPathIfNeed();
	}

	@trace({ level: Level.Full })
	isRootPathExists(): Promise<boolean> {
		return this._resolveFileProvider(this._rootPath, false).isRootPathExists();
	}

	watch(onChange: (changeItems: ItemRefStatus[]) => void): void {
		this._mounts.forEach((provider) => !provider.isReadOnly && (<FileProvider>provider).watch(onChange));
	}

	startWatch(): void {
		this._mounts.forEach((provider) => !provider.isReadOnly && (<FileProvider>provider).startWatch());
	}

	stopWatch(): void {
		this._mounts.forEach((provider) => !provider.isReadOnly && (<FileProvider>provider).stopWatch());
	}

	@trace({ level: Level.Full })
	getItems(path: Path): Promise<FileInfo[]> {
		return this._resolveFileProvider(path, false).getItems(path);
	}

	@trace({ level: Level.Full })
	getItemRef(path: Path): ItemRef {
		return this._resolveFileProvider(path, false).getItemRef(path);
	}

	@trace({ level: Level.Full })
	exists(path: Path): Promise<boolean> {
		return this._resolveFileProvider(path, false, true).exists(path);
	}

	@trace({ level: Level.Full })
	getStat(path: Path, lstat?: boolean): Promise<FileInfo> {
		return this._resolveFileProvider(path, false, true).getStat(path, lstat);
	}

	@trace({ level: Level.Full })
	read(path: Path): Promise<string> {
		return this._resolveFileProvider(path, false).read(path);
	}

	@trace({ level: Level.Full })
	readAsBinary(path: Path): Promise<Buffer> {
		return this._resolveFileProvider(path, false).readAsBinary(path);
	}

	@trace({ level: Level.Full })
	isFolder(path: Path): Promise<boolean> {
		return this._resolveFileProvider(path, false, true).isFolder(path);
	}

	@trace({ level: Level.Full })
	readlink(path: Path): Promise<string> {
		return this._resolveFileProvider(path, false, true).readlink(path);
	}

	@trace({ level: Level.Full })
	readdir(path: Path): Promise<string[]> {
		return this._resolveFileProvider(path, false, false).readdir(path);
	}

	@trace({ level: Level.Files })
	hardlink(target: Path, path: Path): Promise<void> {
		return this._resolveFileProvider(path, true, true).hardlink(target, path);
	}
}
