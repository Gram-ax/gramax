import Path from "../../../../../logic/FileProvider/Path/Path";
import { FileStatus } from "../../../../Watchers/model/FileStatus";

export interface GitStatus {
	path: Path;
	status: FileStatus;
	isUntracked?: boolean;
}
