import { type XXHash, type XXHashAPI } from "xxhash-wasm";

export interface Hashable {
	hash(hash: Hasher, recursive?: boolean): Promise<Hasher>;
}

export default class Hasher {
	private _current: XXHash<number>;
	private _xxhash: XXHashAPI;

	constructor(xxhash: XXHashAPI) {
		this._xxhash = xxhash;
		this._current = this._xxhash.create32(0);
	}

	hash(val: string | object | Uint8Array | number | bigint | boolean) {
		if (!val) return;

		if (typeof val === "object" && !(val instanceof Uint8Array)) {
			Object.values(val).forEach((val) => this.hash(val));
			return this;
		}

		if (typeof val === "string" || val instanceof Uint8Array) {
			this._current.update(val);
			return this;
		}

		this._current.update(val.toString());
		return this;
	}

	finalize() {
		return this._current.digest();
	}
}

export class XxHash {
	private static _xxhash: XXHashAPI;

	static hasher(): Hasher {
		return new Hasher(this._xxhash);
	}

	static async hash(val: Hashable, recursive = true): Promise<number> {
		const hasher = this.hasher();
		await val.hash(hasher, recursive);
		return hasher.finalize();
	}

	static get xxhash() {
		return this._xxhash;
	}

	static async init() {
		const xxhash = await import("xxhash-wasm");
		this._xxhash = await xxhash.default();
	}
}
