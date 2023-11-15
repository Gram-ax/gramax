import MD5 from "@core-ui/hash";
import HashItem from "./HashItems/HashItem";

export default class Hash {
	private hashes = new Map<string, string>();

	async getHash(hashItem: HashItem) {
		return MD5(await hashItem.getHashContent());
	}

	async setHash(hashItem: HashItem) {
		const hash = await this.getHash(hashItem);
		this.hashes.set(hashItem.getKey(), hash);
		return hash;
	}

	hasHash(hashItem: HashItem) {
		return this.hashes.has(hashItem.getKey());
	}

	deleteHash(hashItem: HashItem) {
		this.hashes.delete(hashItem.getKey());
	}
}
