import type { ToSpan } from "@ext/loggers/opentelemetry";
import type Branch from "../../../VersionControl/model/branch/Branch";
import type GitBranchData from "./model/GitBranchData";

export class GitBranch implements Branch, ToSpan {
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

	toSpan() {
		return this._data.name;
	}
}
