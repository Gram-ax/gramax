import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { Buffer } from "buffer";
import { type ItemRefStatus } from "../../../extensions/Watchers/model/ItemStatus";
import Path from "../Path/Path";
import FileInfo from "./FileInfo";

export default interface FileProvider {
	get storageId(): string;
	get rootPath(): Path;

	getItems: (path: Path) => Promise<FileInfo[]>;
	exists: (path: Path) => Promise<boolean>;
	delete: (path: Path, preferTrash?: boolean) => Promise<void>;
	getStat: (path: Path, lstat?: boolean) => Promise<FileInfo>;
	deleteEmptyFolders: (path: Path) => Promise<void>;
	write: (path: Path, data: string | Buffer) => Promise<void>;
	read: (path: Path) => Promise<string>;
	readAsBinary: (path: Path) => Promise<Buffer>;
	getItemRef: (path: Path) => ItemRef;
	move: (from: Path, to: Path) => Promise<void>;
	copy: (from: Path, to: Path) => Promise<void>;
	isFolder: (path: Path) => Promise<boolean>;
	mkdir: (path: Path, mode?: number) => Promise<void>;
	readlink: (path: Path) => Promise<string>;
	readdir: (path: Path) => Promise<string[]>;
	symlink: (target: Path, path: Path) => Promise<void>;
	watch: (onChange: (changeItems: ItemRefStatus[]) => void) => void;
	startWatch: () => void;
	stopWatch: () => void;
	createRootPathIfNeed: () => Promise<void>;
	isRootPathExists: () => Promise<boolean>;
}
