import { FileStatus } from "../../../Watchers/model/FileStatus";
import { VersionControlRange } from "./VersionControlRange";

export interface VersionControlDiff {
	type: FileStatus;
	range: VersionControlRange;
}
