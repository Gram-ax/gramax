import IPermission from "./IPermission";

export default class Permission extends IPermission {
	private _values: string[];
	private _toStringChar = "|-_-|";
	private _defaultValue = "ics-it";

	constructor(data: IPermission | string[] | string | boolean = null) {
		super();
		if (typeof data === "boolean") {
			this._values = data ? [this._defaultValue] : [];
			return;
		}
		if (!data) {
			this._values = [];
			return;
		}
		if (typeof data === "string") {
			if (data === "false") {
				this._values = [];
				return;
			}
			if (data === "true") {
				this._values = [this._defaultValue];
				return;
			}
			this._values = this._stringPermissionParse(data);
			this._values = this._values.map((value) => value.toLowerCase());
			return;
		}
		if (Array.isArray(data)) {
			this._values = data;
			this._values = this._values.map((value) => value.toLowerCase());
			return;
		}
		this._values = data.getValues();
		this._values = this._values.map((value) => value.toLowerCase());
	}

	getValues(): string[] {
		return this._values;
	}

	isWorked(): boolean {
		return this._values.length !== 0;
	}

	combine(permissions: IPermission[], isAnd = false): IPermission {
		if (isAnd) {
			const values = Array.from(new Set(permissions.map((p) => p.getValues()).flat(1)));
			return new Permission(this._values.filter((v) => values.includes(v)));
		} else {
			return new Permission(
				Array.from(new Set([...this._values, ...permissions.map((p) => p.getValues()).flat(1)])),
			);
		}
	}

	toString(): string {
		return this._values.join(this._toStringChar);
	}

	private _stringPermissionParse(permission: string): string[] {
		return permission?.split(this._toStringChar) ?? [];
	}

	protected _enough(permissions: IPermission, isFull = false): boolean {
		if (!permissions) return false;
		if (!isFull) return permissions.getValues().some((value) => this._values.includes(value));
		else return permissions.getValues().every((value) => this._values.includes(value));
	}
}
