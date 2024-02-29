import FileProvider from "../../logic/FileProvider/model/FileProvider";
import Path from "../../logic/FileProvider/Path/Path";

class IndexCacheProvider {
	constructor(private _fp: FileProvider) {}

	async set(key: string, value: any) {
		return await this._fp.write(this._getKeyPath(key), JSON.stringify(value) ?? "{}");
	}

	async get(key: string) {
		return JSON.parse(await this._fp.read(this._getKeyPath(key)));
	}

	async remove(key: string) {
		if (await this.exists(key)) await this._fp.delete(this._getKeyPath(key));
	}

	async exists(key: string) {
		return await this._fp.exists(this._getKeyPath(key));
	}

	private _getKeyPath(key: string): Path {
		return new Path(`IndexCaches/${key}.json`);
	}
}

export default IndexCacheProvider;
