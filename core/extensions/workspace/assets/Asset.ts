import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";

export abstract class Asset {
	constructor(protected readonly _fp: FileProvider) {}

	protected async _exists(path: Path): Promise<boolean> {
		return this._fp.exists(path);
	}

	protected async _read(path: Path): Promise<string | null> {
		if (!(await this._exists(path))) return null;
		return this._fp.read(path).catch(() => null);
	}

	protected async _readBinary(path: Path): Promise<Buffer | null> {
		if (!(await this._exists(path))) return null;
		return this._fp.readAsBinary(path).catch(() => null);
	}

	protected async _write(path: Path, data: string | Buffer): Promise<void> {
		await this._fp.createRootPathIfNeed();
		await this._fp.write(path, data);
	}

	protected async _remove(path: Path): Promise<void> {
		await this._fp.delete(path);
	}

	protected async _listDir(path: Path): Promise<string[]> {
		if (!(await this._exists(path))) return [];
		return this._fp.readdir(path);
	}
}
