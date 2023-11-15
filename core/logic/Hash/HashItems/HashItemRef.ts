import { Buffer } from "buffer";
import { ItemRef } from "../../FileStructue/Item/Item";
import Library from "../../Library/Library";
import HashItem from "./HashItem";

export default class HashItemRef extends HashItem {
	constructor(private _itemRef: ItemRef, private _lib: Library) {
		super();
	}
	public getKey(): string {
		return this._getKey(this._itemRef);
	}

	public async getContent(): Promise<string> {
		return (await this._lib.getFileProvider(this._itemRef.storageId).read(this._itemRef.path)) ?? "";
	}

	public getHashContent(): Promise<string> {
		return this.getContent();
	}

	public async getContentAsBinary(): Promise<Buffer> {
		return await this._lib.getFileProvider(this._itemRef.storageId).readAsBinary(this._itemRef.path);
	}

	private _getKey(ref: ItemRef): string {
		return ref.storageId + "@" + ref.path.value;
	}
}
