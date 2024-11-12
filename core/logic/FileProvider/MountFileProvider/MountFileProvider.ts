import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type ReadOnlyFileProvider from "@core/FileProvider/model/ReadOnlyFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import type Watcher from "@ext/Watchers/model/Watcher";

export default class MountFileProvider implements FileProvider {
	private readonly _rootPath: Path;
	private readonly _mounts = new Map<string, FileProvider | ReadOnlyFileProvider>();

	constructor(rootPath: Path) {
		this._rootPath = rootPath;
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

	static fromDefault(root: Path, watcher?: Watcher) {
		return new this(root).mount(Path.empty, new DiskFileProvider(Path.empty, watcher));
	}

	allFp(): Readonly<Map<string, FileProvider | ReadOnlyFileProvider>> {
		return this._mounts;
	}

	at(path: Path): FileProvider | ReadOnlyFileProvider {
		return this._mounts.get(path.value) || this._mounts.get("/");
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

	mount(mountpoint: Path, fp: FileProvider | ReadOnlyFileProvider) {
		if ((!mountpoint?.value || mountpoint?.value === "/") && fp.isReadOnly)
			throw new Error("Read-only FileProvider cannot be mounted as root");

		fp.withMountPath(this._rootPath.join(mountpoint));
		this._mounts.set(mountpoint?.value || "/", fp);
		return this;
	}

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
		if (this._mounts.size == 1)
			return this._mounts.get("/") as W extends true ? FileProvider : ReadOnlyFileProvider;

		path = path || Path.empty;
		const currentPath = path.value;
		let lastSlashIndex =
			shouldFallbackOnRoot && this.isFallbackOnRoot ? path.parentDirectoryPath.value.length : currentPath.length;

		while (lastSlashIndex > 0) {
			const provider = this._mounts.get(currentPath.slice(0, lastSlashIndex) || "/");
			if (provider) {
				if (writeable && provider.isReadOnly)
					throw new Error(`Requested writable FileProvider but found read-only ${provider.storageId}`);
				return provider as W extends true ? FileProvider : ReadOnlyFileProvider;
			}

			lastSlashIndex = currentPath.lastIndexOf("/", lastSlashIndex - 1);
		}

		const mount = this._mounts.get("/");
		if (!mount) throw new Error("Root mount not found");
		return mount as FileProvider;
	}

	delete(path: Path, preferTrash?: boolean): Promise<void> {
		return this._resolveFileProvider(path, true, true).delete(path, preferTrash);
	}

	deleteEmptyFolders(path: Path): Promise<void> {
		return this._resolveFileProvider(path, true, false).deleteEmptyFolders(path);
	}

	write(path: Path, data: string | Buffer): Promise<void> {
		return this._resolveFileProvider(path, true).write(path, data);
	}

	move(from: Path, to: Path): Promise<void> {
		return this._resolveFileProvider(from, true, true).move(from, to);
	}

	copy(from: Path, to: Path): Promise<void> {
		return this._resolveFileProvider(from, true, true).copy(from, to);
	}

	mkdir(path: Path, mode?: number): Promise<void> {
		return this._resolveFileProvider(path, true).mkdir(path, mode);
	}

	createRootPathIfNeed(): Promise<void> {
		return this._resolveFileProvider(this._rootPath, true).createRootPathIfNeed();
	}

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

	getItems(path: Path): Promise<FileInfo[]> {
		return this._resolveFileProvider(path, false).getItems(path);
	}

	getItemRef(path: Path): ItemRef {
		return this._resolveFileProvider(path, false).getItemRef(path);
	}

	exists(path: Path): Promise<boolean> {
		return this._resolveFileProvider(path, false, true).exists(path);
	}

	getStat(path: Path, lstat?: boolean): Promise<FileInfo> {
		return this._resolveFileProvider(path, false, true).getStat(path, lstat);
	}

	read(path: Path): Promise<string> {
		return this._resolveFileProvider(path, false).read(path);
	}

	readAsBinary(path: Path): Promise<Buffer> {
		return this._resolveFileProvider(path, false).readAsBinary(path);
	}

	isFolder(path: Path): Promise<boolean> {
		return this._resolveFileProvider(path, false, true).isFolder(path);
	}

	readlink(path: Path): Promise<string> {
		return this._resolveFileProvider(path, false, true).readlink(path);
	}

	readdir(path: Path): Promise<string[]> {
		return this._resolveFileProvider(path, false, false).readdir(path);
	}

	symlink(target: Path, path: Path): Promise<void> {
		return this._resolveFileProvider(path, true, true).symlink(target, path);
	}
}
