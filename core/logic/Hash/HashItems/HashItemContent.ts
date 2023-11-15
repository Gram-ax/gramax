import { Buffer } from "buffer";
import HashItem from "./HashItem";

export default class HashItemContent extends HashItem {
	constructor(
		private _key: string,
		private _getContent: () => Promise<string> | string,
		private _getHashContent?: () => Promise<string> | string,
	) {
		super();
	}

	public getKey(): string {
		return this._key;
	}

	public async getContent(): Promise<string> {
		return await this._getContent();
	}

	public async getHashContent(): Promise<string> {
		return await (this._getHashContent ? this._getHashContent() : this.getContent());
	}

	public async getContentAsBinary(): Promise<Buffer> {
		return Buffer.from(await this._getContent());
	}
}
