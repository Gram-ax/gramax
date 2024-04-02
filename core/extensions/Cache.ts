import Path from "../logic/FileProvider/Path/Path";
import FileProvider from "../logic/FileProvider/model/FileProvider";

const STORAGE_DIR_NAME = ".storage";

class Cache {
	constructor(private _fp: FileProvider, private _pathPrefix = STORAGE_DIR_NAME) {}

	async set(key: string, value: string) {
		return this._fp.write(this._getKeyPath(key), value ?? "");
	}

	async get(key: string): Promise<string> {
		return this._fp.read(this._getKeyPath(key));
	}

	async delete(key: string): Promise<void> {
		return this._fp.delete(this._getKeyPath(key));
	}

	async exists(key: string): Promise<boolean> {
		return this._fp.exists(this._getKeyPath(key));
	}

	async getComplex(key: string): Promise<Cache> {
		if (!(await this.exists(key))) await this._setComplex(key);
		return new Cache(this._fp, Path.join(this._pathPrefix, key));
	}

	getAbsoluteKeyPath(key: string): Path {
		return this._fp.rootPath.join(this._getKeyPath(key));
	}

	private async _setComplex(key: string) {
		if (!(await this.exists(key))) return this._fp.mkdir(this._getKeyPath(key));
	}

	private _getKeyPath(key: string): Path {
		return new Path(Path.join(this._pathPrefix, key));
	}
}

export default Cache;
