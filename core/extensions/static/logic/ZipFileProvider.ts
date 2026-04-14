import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import type FileInfo from "@core/FileProvider/model/FileInfo";
import type Path from "@core/FileProvider/Path/Path";
import jszip from "@dynamicImports/jszip";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import type { default as JSZipType } from "jszip";

class ZipFileProvider extends DiskFileProvider {
	private constructor(private _zip: JSZipType) {
		super("");
	}

	static async create(): Promise<ZipFileProvider> {
		return new ZipFileProvider(new (await jszip())());
	}

	static createWithExistingZip(zip: JSZipType): ZipFileProvider {
		return new ZipFileProvider(zip);
	}

	async copy(from: Path, to: Path): Promise<void> {
		this.currentFolder.file(to.value, (await super.readAsBinary(from)) as any as ArrayBuffer);
	}

	async mkdir() {}

	async read(path: Path): Promise<string> {
		return this.currentFolder.file(path.value).async("string");
	}

	// eslint-disable-next-line @typescript-eslint/require-await,
	async write(path: Path, data: string) {
		this.currentFolder.file(path.value, data);
	}

	get zip() {
		return this._zip;
	}

	get currentFolder() {
		return this._zip.folder(this._rootPath.value);
	}

	setRootPath(rootPath: Path) {
		this._rootPath = rootPath;
	}

	async merge(other: ZipFileProvider, targetPath?: Path): Promise<void> {
		const otherZip = other.zip;
		const basePath = targetPath ? targetPath.value : "";

		const files: Array<{ path: string; file: any }> = [];
		otherZip.forEach((relativePath, file) => {
			files.push({ path: relativePath, file });
		});

		for (const { path: relativePath, file } of files) {
			const fullPath = basePath ? `${basePath}/${relativePath}` : relativePath;
			if (file.dir) {
				this._zip.folder(fullPath);
			} else {
				const content = await file.async("nodebuffer");
				this._zip.file(fullPath, content);
			}
		}
	}

	/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unused-vars*/
	async getItems(path: Path): Promise<FileInfo[]> {
		throw new Error(this._getMsgNotImplemented("getItems"));
	}

	async isFolder(path: Path): Promise<boolean> {
		throw new Error(this._getMsgNotImplemented("isFolder"));
	}

	async exists(path: Path): Promise<boolean> {
		return !!this._zip.file(path.value);
	}

	async getStat(path: Path, lstat = false): Promise<FileInfo> {
		throw new Error(this._getMsgNotImplemented("getStat"));
	}

	async delete(path: Path, preferTrash?: boolean): Promise<void> {
		const pathname = path.value;
		this.currentFolder.remove(pathname === "." || pathname === "/" ? "" : pathname);
	}

	async move(from: Path, to: Path): Promise<void> {
		throw new Error(this._getMsgNotImplemented("move"));
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		return this._zip.file(path.value).async("nodebuffer");
	}

	async readdir(path: Path): Promise<string[]> {
		throw new Error(this._getMsgNotImplemented("readdir"));
	}

	async readlink(path: Path): Promise<string> {
		throw new Error(this._getMsgNotImplemented("readlink"));
	}

	async symlink(target: Path, path: Path): Promise<void> {
		throw new Error(this._getMsgNotImplemented("symlink"));
	}

	async deleteEmptyFolders(folderPath: Path): Promise<void> {
		throw new Error(this._getMsgNotImplemented("deleteEmptyFolders"));
	}

	watch(callback: (changeItems: ItemRefStatus[]) => void): void {
		throw new Error(this._getMsgNotImplemented("watch"));
	}

	stopWatch(): void {
		throw new Error(this._getMsgNotImplemented("stopWatch"));
	}

	startWatch(): void {
		throw new Error(this._getMsgNotImplemented("startWatch"));
	}

	async createRootPathIfNeed(): Promise<void> {
		throw new Error(this._getMsgNotImplemented("createRootPathIfNeed"));
	}

	async isRootPathExists(): Promise<boolean> {
		throw new Error(this._getMsgNotImplemented("isRootPathExists"));
	}

	private _getMsgNotImplemented(method: string) {
		return `${method} is not supported in RpcFileProvider`;
	}
}

export default ZipFileProvider;
