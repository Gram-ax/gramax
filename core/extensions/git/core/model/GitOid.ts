import type { ToSpan } from "@ext/loggers/opentelemetry";

export class GitOid implements ToSpan {
	constructor(private _value: string) {}
	toString() {
		return this._value;
	}
	compare(commit: GitOid): boolean {
		if (!commit) return false;
		return this._value === commit.toString();
	}

	toSpan() {
		return this._value;
	}
}
