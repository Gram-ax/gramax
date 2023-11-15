import IPermission from "./IPermission";
import PermissionType from "./model/PermissionType";

export default class AllPermission extends IPermission {
	private _values: string[];

	constructor() {
		super();
		this._values = [];
		this._type = PermissionType.all;
	}

	getValues(): string[] {
		return this._values;
	}

	isWorked(): boolean {
		return true;
	}

	combine(): IPermission {
		return this;
	}

	toString(): string {
		return "";
	}

	protected _enough(): boolean {
		return true;
	}
}
