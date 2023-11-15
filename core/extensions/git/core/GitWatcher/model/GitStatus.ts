import Path from "../../../../../logic/FileProvider/Path/Path";
import { FileStatus } from "../../../../Watchers/model/FileStatus";

export interface GitStatus {
	path: Path;
	type: FileStatus;
	isUntracked?: boolean;
}
