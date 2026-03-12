import type SideBarResourceData from "@ext/git/actions/Publish/model/SideBarResourceData";
import type { DiffFile, DiffFilePaths } from "@ext/VersionControl/model/Diff";

interface SideBarData {
	isResource: boolean;
	parentPath?: DiffFilePaths;
	data: {
		title: string;
		isChanged: boolean;
		resources: SideBarResourceData[];
		isChecked: boolean;
		logicPath?: string;
		added?: number;
		deleted?: number;
	} & Pick<DiffFile, "filePath" | "status">;
}

export default SideBarData;
