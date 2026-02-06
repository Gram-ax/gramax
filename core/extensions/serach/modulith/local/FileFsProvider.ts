import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { FsProvider } from "@ics/modulith-search-infra";

export class FileFsProvider implements FsProvider {
	constructor(
		private readonly _fp: FileProvider,
		private readonly _base: Path = new Path(),
	) {}

	exists(path: string): Promise<boolean> {
		const fullPath = this._getFullPath(path);
		return this._fp.exists(fullPath);
	}

	writeFile(path: string, content: string): Promise<void> {
		const fullPath = this._getFullPath(path);
		return this._fp.write(fullPath, content);
	}

	readFile(path: string): Promise<string> {
		const fullPath = this._getFullPath(path);
		return this._fp.read(fullPath);
	}

	removeFile(path: string): Promise<void> {
		const fullPath = this._getFullPath(path);
		return this._fp.delete(fullPath);
	}

	getProvider(path: string): Promise<FsProvider> {
		return Promise.resolve(new FileFsProvider(this._fp, this._getFullPath(path)));
	}

	private _getFullPath(path: string) {
		const res = this._base.join(new Path(path));
		return res;
	}
}
