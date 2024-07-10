import { type XXHashAPI } from "xxhash-wasm";
import HashItem from "./HashItems/HashItem";

export default class Hash {
	private _hashes = new Map<string, string>();
	private _xxhash: XXHashAPI;

	async getHash(hashItem: HashItem) {
		if (!this._xxhash) await this._init();
		return this._xxhash.h64ToString(await hashItem.getHashContent());
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
	private async _init() {
		const xxhash = await import("xxhash-wasm");
		this._xxhash = await xxhash.default();
	}
}
