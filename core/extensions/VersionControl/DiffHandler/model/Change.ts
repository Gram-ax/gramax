import { FileStatus } from "../../../Watchers/model/FileStatus";

export interface Change {
	value: string;
	type?: FileStatus;
}
