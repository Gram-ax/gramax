import type { DiffHunk } from "@ext/VersionControl/DiffHandler/model/DiffHunk";

export interface VersionControlInfo {
	version: string;
	author: string;
	date: string;
	filePath: {
		path: string;
		oldPath?: string;
		diff?: DiffHunk[];
	};
}
