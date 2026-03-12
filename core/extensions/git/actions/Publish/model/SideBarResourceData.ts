import type { DiffFile, DiffFilePaths } from "@ext/VersionControl/model/Diff";

interface SideBarResourceData {
	isResource: true;
	parentPath?: DiffFilePaths;
	data: {
		title: string;
		added?: number;
		deleted?: number;
	} & Pick<DiffFile, "status" | "filePath">;
}

export default SideBarResourceData;
