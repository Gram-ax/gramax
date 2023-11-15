import Branch from "../../../VersionControl/model/branch/Branch";
import GitBranchData from "./model/GitBranchData";

export class GitBranch implements Branch {
	constructor(private _data: GitBranchData) {}

	getData(): GitBranchData {
		return this._data;
	}

	toString(): string {
		return this._data.name;
	}
	compare(version: Branch): boolean {
		if (!version) return false;
		return this._data.name === version.toString();
	}
}
