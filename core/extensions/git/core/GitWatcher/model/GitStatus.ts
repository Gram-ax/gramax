import type Path from "../../../../../logic/FileProvider/Path/Path";
import type { FileStatus } from "../../../../Watchers/model/FileStatus";

export interface GitStatus {
	path: Path;
	status: FileStatus;
	isUntracked?: boolean;
}
