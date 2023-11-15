export enum FileStatus {
	modified = "modified",
	delete = "delete",
	new = "new",
	rename = "rename",
	conflict = "conflict",

	/**
	 * ~ no changes
	 **/
	current = "current",
}
