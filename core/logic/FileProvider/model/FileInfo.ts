// interface FileInfo {
// 	name: string;
// 	path: Path;
// 	size: number;
// 	lastModified: Date;
// 	isDirectory: boolean;
// }

import Path from "../Path/Path";
export interface FileInfo {
	type: "file" | "dir";
	mode: any;
	size: number;
	ino: any;
	path: Path;
	mtimeMs: number;
	ctimeMs: number;
	uid: number;
	gid: number;
	name: string;
	isFile(): boolean;
	isDirectory(): boolean;
	isSymbolicLink(): boolean;
}

export default FileInfo;
