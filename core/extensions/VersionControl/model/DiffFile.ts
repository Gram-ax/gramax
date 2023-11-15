import { FileStatus } from "../../Watchers/model/FileStatus";
import { Change } from "../DiffHandler/model/Change";

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
	diff?: {
		changes: Change[];
		added: number;
		removed: number;
	};
}
