import PermissionJSONData from "./model/PermissionJSONData";
import PermissionType from "./model/PermissionType";

abstract class IPermission {
	protected _type: PermissionType = PermissionType.plain;

	abstract toString(): string;
	abstract isWorked(): boolean;
	abstract getValues(): string[];
	abstract combine(permissions: IPermission[], isAnd?: boolean): IPermission;

	enough(permissions: IPermission, isFull?: boolean): boolean {
		if (!permissions || !this) return false;
		if (!permissions.isWorked() || !this.isWorked()) return false;
		return this._enough(permissions, isFull) || permissions._enough(this, isFull);
	}

	toJSON(): PermissionJSONData {
		return {
			permissions: this.toString(),
			type: this._type,
		};
	}

	protected abstract _enough(permissions: IPermission, isFull?: boolean): boolean;
}

export default IPermission;
