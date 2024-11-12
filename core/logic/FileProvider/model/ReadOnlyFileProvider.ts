import type FileInfo from "@core/FileProvider/model/FileInfo";
import type Path from "@core/FileProvider/Path/Path";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";

export default interface ReadOnlyFileProvider {
	get storageId(): string;
	get rootPath(): Path;
	get isReadOnly(): boolean;
	get isFallbackOnRoot(): boolean;

	withMountPath: (path: Path) => void;
	isRootPathExists: () => Promise<boolean>;
	getItems: (path: Path) => Promise<FileInfo[]>;
	getItemRef: (path: Path) => ItemRef;
	exists: (path: Path) => Promise<boolean>;
	getStat: (path: Path, lstat?: boolean) => Promise<FileInfo>;
	read: (path: Path) => Promise<string>;
	readAsBinary: (path: Path) => Promise<Buffer>;
	isFolder: (path: Path) => Promise<boolean>;
	readlink: (path: Path) => Promise<string>;
	readdir: (path: Path) => Promise<string[]>;
	symlink: (target: Path, path: Path) => Promise<void>;
}
