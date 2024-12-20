import { XxHash } from "@core/Hash/Hasher";
import HashItem from "./HashItems/HashItem";

export default class HashItemProvider {
	private _hashes = new Map<string, string>();

	async getHash(hashItem: HashItem) {
		return XxHash.xxhash.h64ToString(await hashItem.getHashContent());
	}

	async setHash(hashItem: HashItem) {
		const hash = await this.getHash(hashItem);
		this._hashes.set(hashItem.getKey(), hash);
		return hash;
	}

	hasHash(hashItem: HashItem) {
		return this._hashes.has(hashItem.getKey());
	}

	deleteHash(hashItem: HashItem) {
		this._hashes.delete(hashItem.getKey());
	}
}
