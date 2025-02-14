import IPermissionMap, { PermissionMapJSONData, PermissionMapType } from "./IPermissionMap";

class AllPermissionMap implements IPermissionMap {
	get type() {
		return PermissionMapType.all;
	}

	get keys() {
		return [];
	}

	enough() {
		return true;
	}

	someEnough() {
		return true;
	}

	addPermission() {
		// not implemented
	}

	updateAllPermissions() {
		// not implemented
	}

	toJSON(): PermissionMapJSONData {
		return {
			type: this.type,
			permissions: {},
		};
	}
}

export default AllPermissionMap;
