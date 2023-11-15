import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { Conflict, Normal } from "./FileTypes";

export type MergeFile = {
	path: string;
	content: string;
	type: FileStatus;
	title?: string;
};
export interface ParsedMergeFile extends MergeFile {
	parts: (Normal | Conflict)[];
}
