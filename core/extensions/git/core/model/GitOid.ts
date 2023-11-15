export class GitOid {
	constructor(private _value: string) {}
	toString() {
		return this._value;
	}
	compare(commit: GitOid): boolean {
		if (!commit) return false;
		return this._value === commit.toString();
	}
}
