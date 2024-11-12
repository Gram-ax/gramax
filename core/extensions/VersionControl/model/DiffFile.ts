import { FileStatus } from "../../Watchers/model/FileStatus";
import { Change } from "../DiffHandler/model/Change";

export interface DiffChanges {
	changes: Change[];
	added: number;
	removed: number;
}

export default interface DiffFile {
	type: "resource" | "item";
	changeType: FileStatus;
	filePath: {
		path: string;
		oldPath?: string;
		diff?: Change[];
	};
	title: string;
	isChanged: boolean;
	content?: string;
	diff?: DiffChanges;
}
