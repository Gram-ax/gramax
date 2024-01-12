import FileInfo from "../../../../../logic/FileProvider/model/FileInfo";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";

class IsomorphicFileProvider {
	constructor(private _fp: FileProvider) {}

	async readFile(path: string, options?: BufferEncoding | { encoding?: string }): Promise<Uint8Array | string> {
		const toPath = this._pathConverter(path);
		let result: Uint8Array | string;
		if (!options) result = await this._fp.readAsBinary(toPath);
		if (typeof options === "string") result = await this._fp.read(toPath);
		else if (options.encoding === "utf8") result = await this._fp.read(toPath);
		else result = await this._fp.readAsBinary(toPath);
		if (!result) throw new Error(`Не удалось прочитать файл по пути ${path}`);
		return result;
	}

	writeFile(path: string, data: string | Buffer): Promise<void> {
		return this._fp.write(this._pathConverter(path), data);
	}

	unlink(path: string): Promise<void> {
		return this._fp.delete(this._pathConverter(path));
	}

	async readdir(path: string): Promise<string[]> {
		const result = await this._fp.readdir(this._pathConverter(path));
		if (!result) throw new Error(`Не удалось прочитать директорию по пути ${path}`);
		return result;
	}

	mkdir(path: string, mode?: number): Promise<void> {
		return this._fp.mkdir(this._pathConverter(path), mode);
	}

	rmdir(path: string): Promise<void> {
		return this._fp.delete(this._pathConverter(path));
	}

	async stat(path: string): Promise<FileInfo> {
		const result = await this._fp.getStat(this._pathConverter(path));
		if (!result) throw new Error(`Не удалось получить иформацию о файле/папке по пути ${path}`);
		return result;
	}

	async lstat(path: string): Promise<FileInfo> {
		const result = await this._fp.getStat(this._pathConverter(path), true);
		if (!result)
			throw new Error(`Не удалось получить иформацию о файле/папке с символическими ссылками по пути ${path}`);
		return result;
	}

	async readlink(path: string): Promise<string> {
		const result = await this._fp.readlink(this._pathConverter(path));
		if (!result) throw new Error(`Не удалось прочитать символическую ссылку файла по пути ${path}`);
		return result;
	}

	symlink(target: string, path: string): Promise<void> {
		return this._fp.symlink(this._pathConverter(target), this._pathConverter(path));
	}

	private _pathConverter(path: string) {
		return new Path(path);
	}
}

export default IsomorphicFileProvider;
