import IPermission from "@ext/security/logic/Permission/IPermission";
import IPermissionMap, { PermissionMapJSONData, PermissionMapType } from "./IPermissionMap";

class RelaxPermissionMap implements IPermissionMap {
	constructor(private _permissions: { [key: string]: IPermission }) {}

	get type() {
		return PermissionMapType.relax;
	}

	get keys(): string[] {
		return Object.keys(this._permissions);
	}

	enough(key: string, permission: IPermission): boolean {
		const keyPermission = this._permissions[key];
		if (!keyPermission) return true;
		return keyPermission.enough?.(permission) ?? false;
	}

	someEnough(permission: IPermission): boolean {
		return Object.values(this._permissions).some((keyPermission) => keyPermission?.enough?.(permission) ?? false);
	}

	addPermission(key: string, permission: IPermission): void {
		this._permissions[key] = permission;
	}

	updateAllPermissions(permission: IPermission): void {
		Object.keys(this._permissions).forEach((key) => {
			this._permissions[key] = permission;
		});
	}

	toJSON(): PermissionMapJSONData {
		return {
			type: this.type,
			permissions: Object.fromEntries(
				Object.entries(this._permissions).map(([catalogName, permission]) => [
					catalogName,
					permission.toJSON(),
				]),
			),
		};
	}
}

export default RelaxPermissionMap;
