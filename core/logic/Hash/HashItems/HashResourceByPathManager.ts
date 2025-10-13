import FileProvider from "@core/FileProvider/model/FileProvider";
import { Buffer } from "buffer";
import Path from "../../FileProvider/Path/Path";
import HashItem from "./HashItem";

export default class HashResourceByPathManager extends HashItem {
	constructor(private _fullResourcePath: Path, private _fp: FileProvider, private _basePath: Path) {
		super();
	}

	public getKey(): string {
		return this._basePath.value + "@" + this._fullResourcePath.value;
	}

	public async getContent(): Promise<string> {
		if (!(await this._fp.exists(this._getPath()))) return "";
		return (await this._fp.read(this._getPath())) ?? "";
	}

	public getHashContent(): Promise<string> {
		return this.getContent();
	}

	public async getContentAsBinary(): Promise<Buffer> {
		if (!(await this._fp.exists(this._getPath()))) return Buffer.from("");
		return (await this._fp.readAsBinary(this._getPath())) ?? Buffer.from("");
	}

	private _getPath(): Path {
		return this._basePath.join(this._fullResourcePath);
	}
}
