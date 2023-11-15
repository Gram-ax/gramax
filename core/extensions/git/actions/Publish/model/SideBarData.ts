import DiffFile from "../../../../VersionControl/model/DiffFile";
import { FileStatus } from "../../../../Watchers/model/FileStatus";
import SideBarResourceData from "./SideBarResourceData";

interface SideBarData extends Pick<DiffFile, "diff"> {
	data: {
		title: string;
		isChanged: boolean;
		resources: SideBarResourceData[];
		changeType: FileStatus;
		isChecked: boolean;
		logicPath?: string;
	} & Pick<DiffFile, "filePath">;
}

export default SideBarData;
