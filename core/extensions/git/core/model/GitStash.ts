export default class GitStash {
	constructor(private _value: string) {}
	toString() {
		return this._value;
	}
	compare(stash: GitStash): boolean {
		if (!stash) return false;
		return this._value === stash.toString();
	}
}
