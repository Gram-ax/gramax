import type { FileStatus } from "../../../Watchers/model/FileStatus";
import type { VersionControlRange } from "./VersionControlRange";

export interface VersionControlDiff {
	type: FileStatus;
	range: VersionControlRange;
}
