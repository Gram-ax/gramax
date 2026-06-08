import Path from "@core/FileProvider/Path/Path";
import type { RpcFileProvider } from "@ext/serach/modulith/search/worker/RpcFileProvider";
import type { FsProvider } from "@ics/article-search/fs";

export class RpcFsProvider implements FsProvider {
	constructor(
		private readonly _fp: RpcFileProvider,
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

	writeArrayBuffer(path: string, content: Uint8Array): Promise<void> {
		const fullPath = this._getFullPath(path);
		return this._fp.write(fullPath, Buffer.from(content.buffer, content.byteOffset, content.byteLength));
	}

	readFile(path: string): Promise<string> {
		const fullPath = this._getFullPath(path);
		return this._fp.read(fullPath);
	}

	async readArrayBuffer(path: string): Promise<Uint8Array> {
		const fullPath = this._getFullPath(path);
		return await this._fp.readAsArrayBuffer(fullPath);
	}

	removeFile(path: string): Promise<void> {
		const fullPath = this._getFullPath(path);
		return this._fp.delete(fullPath);
	}

	getProvider(path: string): Promise<FsProvider> {
		return Promise.resolve(new RpcFsProvider(this._fp, this._getFullPath(path)));
	}

	private _getFullPath(path: string) {
		const res = this._base.join(new Path(path));
		return res;
	}
}
