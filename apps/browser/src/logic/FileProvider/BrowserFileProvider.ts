import Path from "@core/FileProvider/Path/Path";
import FileInfo from "@core/FileProvider/model/FileInfo";
import FileProvider from "@core/FileProvider/model/FileProvider";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import FS, { PromisifiedFS } from "@isomorphic-git/lightning-fs";
import { Buffer } from "buffer";

export class BrowserFileProvider implements FileProvider {
	private _fs: PromisifiedFS;

	constructor(private _root: Path, private _name = "doc-reader") {
		this._fs = new FS(_name).promises;
	}

	get storageId(): string {
		return `IndexedDB@${this._name}`;
	}

	get rootPath(): Path {
		return this._root;
	}

	// TODO: delete in future
	async migrate(fp: FileProvider) {
		const blacklist = ["mdt", "dcore", "sellout", "org-team"];
		if (fp === this) return;
		const readdir = await this.readdir(Path.empty);
		if (readdir.length == 0 || readdir.includes(".migrated")) return;

		console.warn(`migrating: ${this.storageId} -> ${fp.storageId}`);

		const copy = async (base: Path) => {
			const items = await this.getItems(base);
			for (const item of items.filter((f) => !blacklist.includes(f.name))) {
				if (!item.isFile()) {
					await copy(item.path);
					continue;
				}

				if (await fp.exists(item.path)) {
					console.warn(`skipping ${item.path.value}`);
					continue;
				}

				const content = await this.readAsBinary(item.path);
				console.warn(
					`copying ${item.path.value} with size: ${
						content?.byteLength ? content.byteLength / 1024 / 1024 : "0"
					}mb`,
				);
				if (!content) return;
				await fp.write(new Path("docs").subDirectory(item.path), content);
			}
		};

		await copy(new Path("docs"));

		for (const entry of await fp.getItems(Path.empty)) {
			if (!entry.isDirectory()) continue;

			const readdir = await fp.readdir(entry.path);
			if (readdir.length == 0 || (readdir.length == 1 && readdir.includes(".git"))) await fp.delete(entry.path);
		}

		await this.write(new Path(".migrated"), "");
	}

	async getItems(path: Path): Promise<FileInfo[]> {
		if (!(await this.exists(path))) return [];
		const files = await this.readdir(path);
		return (
			await Promise.all(
				files.map(async (name): Promise<FileInfo> => {
					const itemPath = path.join(new Path(name));
					if (!(await this.exists(itemPath))) return null;
					return await this.getStat(itemPath, true);
				}),
			)
		).filter((u) => u);
	}

	exists(path: Path): Promise<boolean> {
		return this._fs
			.stat(this._path(path))
			.then(() => true)
			.catch(() => false);
	}

	readlink(path: Path): Promise<string> {
		return this._fs.readlink(this._path(path));
	}

	async symlink(target: Path, path: Path): Promise<void> {
		await this._fs.symlink(target.value, this._path(path));
	}

	async delete(path: Path): Promise<void> {
		const stats = await this._fs.stat(this._path(path));
		if (stats.isFile()) return this._fs.unlink(this._path(path));

		await this.getItems(path).then(async (infos) => await Promise.all(infos.map((item) => this.delete(item.path))));
		await this._fs.rmdir(this._path(path));
	}

	async getStat(path: Path, lstat?: boolean): Promise<FileInfo> {
		const stats = lstat ? await this._fs.lstat(this._path(path)) : await this._fs.stat(this._path(path));
		return Object.assign(stats, {
			name: path.nameWithExtension,
			path,
		});
	}

	async deleteEmptyFolders(path: Path): Promise<void> {
		const paths = (await this.getItems(path)).filter((item) => item.isDirectory()).map((item) => item.path);
		for (const path of paths) {
			if ((await this.readdir(path)).length > 0) continue;
			await this.delete(path);
		}
	}

	async write(path: Path, data: string | Buffer): Promise<void> {
		const parent = path.parentDirectoryPath;
		await this._mkdirs(new Path(this._path(parent)));
		await this._fs.writeFile(this._path(path), data);
	}

	async read(path: Path): Promise<string> {
		return (await this.readAsBinary(path))?.toString();
	}

	async readAsBinary(path: Path): Promise<Buffer> {
		return await this._fs
			.readFile(this._path(path))
			.then((content) => Buffer.from(content))
			.catch(() => undefined);
	}

	getItemRef(path: Path): ItemRef {
		return { path, storageId: this.storageId };
	}

	async move(from: Path, to: Path): Promise<void> {
		await this.copy(from, to);
		await this.delete(from);
	}

	async copy(from: Path, to: Path): Promise<void> {
		const stats = await this.getStat(from);
		if (stats?.isFile()) return this.write(to, await this.readAsBinary(from));
		await this.mkdir(to);
		await this.getItems(from).then((infos) =>
			Promise.all(infos.map((info) => this.copy(info.path, to.join(new Path(info.name))))),
		);
	}

	async mkdir(path: Path) {
		await this._mkdirs(new Path(this._path(path)));
	}

	readdir(path: Path) {
		return this._fs.readdir(this._path(path));
	}

	async isFolder(path: Path): Promise<boolean> {
		return await this._fs
			.lstat(this._path(path))
			.then((s) => s.isDirectory())
			.catch(() => undefined);
	}

	watch() {}

	startWatch() {}

	stopWatch() {}

	validate() {
		return Promise.resolve();
	}

	private async _mkdirs(path: Path) {
		if (
			path.value &&
			!(await this._fs
				.stat(path.value)
				.then(() => true)
				.catch(() => false))
		) {
			await this._mkdirs(path.parentDirectoryPath);
			await this._fs.mkdir(path.value);
		}
	}

	private _path(path: Path) {
		const joined = this._root.join(path);
		return joined.value[0] == "/" ? joined.value : "/" + joined.value;
	}
}
