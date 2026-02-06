import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type { Workspace } from "@ext/workspace/Workspace";
import { Buffer } from "buffer";
import HashItem from "./HashItem";

export default class HashItemRef extends HashItem {
	constructor(
		private _itemRef: ItemRef,
		private _workspace: Workspace,
	) {
		super();
	}
	public getKey(): string {
		return this._getKey(this._itemRef);
	}

	public async getContent(): Promise<string> {
		return (await this._workspace.getFileProvider().read(this._itemRef.path)) ?? "";
	}

	public getHashContent(): Promise<string> {
		return this.getContent();
	}

	public async getContentAsBinary(): Promise<Buffer> {
		return await this._workspace.getFileProvider().readAsBinary(this._itemRef.path);
	}

	private _getKey(ref: ItemRef): string {
		return ref.storageId + "@" + ref.path.value;
	}
}
