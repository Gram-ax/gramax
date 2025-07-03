import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import FileInfo from "@core/FileProvider/model/FileInfo";
import Path from "@core/FileProvider/Path/Path";
import { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import type { default as JSZipType } from "jszip";

class ZipFileProvider extends DiskFileProvider {
	private constructor(private _zip: JSZipType) {
		super("");
	}

	static async create(): Promise<ZipFileProvider> {
		const JSZip = await import("jszip");
		return new ZipFileProvider(new JSZip.default());
	}

	async copy(from: Path, to: Path): Promise<void> {
		this._zip.file(to.value, (await super.readAsBinary(from)) as any as ArrayBuffer);
	}

	async mkdir() {}

	async read(path: Path): Promise<string> {
		return this._zip.file(path.value).async("string");
	}

	// eslint-disable-next-line @typescript-eslint/require-await,
	async write(path: Path, data: string) {
		this._zip.file(path.value, data);
	}

	get zip() {
		return this._zip;
	}

	/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unused-vars*/
	async getItems(path: Path): Promise<FileInfo[]> {
		throw new Error("Not Supported");
	}

	async isFolder(path: Path): Promise<boolean> {
		throw new Error("Not Supported");
	}

	async exists(uri: Path): Promise<boolean> {
		throw new Error("Not Supported");
	}

	async getStat(path: Path, lstat = false): Promise<FileInfo> {
		throw new Error("Not Supported");
	}

	async delete(path: Path, preferTrash?: boolean): Promise<void> {
		throw new Error("Not Supported");
	}

	async move(from: Path, to: Path): Promise<void> {
		throw new Error("Not Supported");
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		throw new Error("Not Supported");
	}

	async readdir(path: Path): Promise<string[]> {
		throw new Error("Not Supported");
	}

	async readlink(path: Path): Promise<string> {
		throw new Error("Not Supported");
	}

	async symlink(target: Path, path: Path): Promise<void> {
		throw new Error("Not Supported");
	}

	async deleteEmptyFolders(folderPath: Path): Promise<void> {
		throw new Error("Not Supported");
	}

	watch(callback: (changeItems: ItemRefStatus[]) => void): void {
		throw new Error("Not Supported");
	}

	stopWatch(): void {
		throw new Error("Not Supported");
	}

	startWatch(): void {
		throw new Error("Not Supported");
	}

	async createRootPathIfNeed(): Promise<void> {
		throw new Error("Not Supported");
	}

	async isRootPathExists(): Promise<boolean> {
		throw new Error("Not Supported");
	}
}

export default ZipFileProvider;
