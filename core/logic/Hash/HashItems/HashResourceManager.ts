import type Context from "@core/Context/Context";
import { Buffer } from "buffer";
import type Path from "../../FileProvider/Path/Path";
import type ResourceManager from "../../Resource/ResourceManager";
import HashItem from "./HashItem";

export default class HashResourceManager extends HashItem {
	constructor(
		private _path: Path,
		private _resourceManager: ResourceManager,
		private _ctx: Context,
	) {
		super();
	}

	public getKey(): string {
		return `${this._resourceManager.basePath.value}@${this._path.value}`;
	}

	public async getContent(): Promise<string> {
		return (await this._resourceManager.getContent(this._path, this._ctx))?.toString() ?? "";
	}

	public getHashContent(): Promise<string> {
		return this.getContent();
	}

	public async getContentAsBinary(): Promise<Buffer> {
		return (await this._resourceManager.getContent(this._path, this._ctx)) ?? Buffer.from("");
	}
}
