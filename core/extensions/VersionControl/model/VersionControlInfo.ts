import type Path from "@core/FileProvider/Path/Path";

export interface VersionControlInfo {
	version: string;
	author: string;
	date: string;
	path: Path;
	content: string;
	parentPath?: Path;
	parentContent?: string;
}
