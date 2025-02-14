import { FileStatus } from "../../../Watchers/model/FileStatus";

export interface DiffHunk {
	value: string;
	type?: FileStatus;
}
