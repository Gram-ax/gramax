import { Buffer } from "buffer";
import Path from "../../FileProvider/Path/Path";
import FileProvider from "../../FileProvider/model/FileProvider";
import ResourceManager from "../../Resource/ResourceManager";
import HashItem from "./HashItem";

export default class HashResourceManager extends HashItem {
	constructor(
		private _path: Path,
		private _fp: FileProvider,
		private _resourceManager: ResourceManager,
	) {
		super();
	}

	public getKey(): string {
		return this._resourceManager.basePath.value + "@" + this._path.value;
	}

	public async getContent(): Promise<string> {
		return (await this._resourceManager.getContent(this._path, this._fp))?.toString() ?? "" ?? "";
	}

	public getHashContent(): Promise<string> {
		return this.getContent();
	}

	public async getContentAsBinary(): Promise<Buffer> {
		return (await this._resourceManager.getContent(this._path, this._fp)) ?? Buffer.from("");
	}
}
