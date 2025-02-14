import Version from "../../../VersionControl/model/Version";

export class GitVersion implements Version {
	constructor(private _value: string) {}
	toString() {
		return this._value;
	}
	compare(commit: Version): boolean {
		if (!commit) return false;
		return this._value === commit.toString();
	}

	static from(value: string | GitVersion) {
		if (!value) return null;
		if (typeof value === "string") return new GitVersion(value);
		return value;
	}
}
