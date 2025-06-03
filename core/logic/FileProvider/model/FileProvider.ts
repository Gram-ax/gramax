import { Event } from "@core/Event/EventEmitter";
import type ReadOnlyFileProvider from "@core/FileProvider/model/ReadOnlyFileProvider";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import Path from "../Path/Path";

export type FileProviderEvents = Event<"delete", { path: Path }> &
	Event<"write", { path: Path; data: string | Buffer }> &
	Event<"move", { from: Path; to: Path }> &
	Event<"copy", { from: Path; to: Path }>;

export default interface FileProvider extends ReadOnlyFileProvider {
	delete: (path: Path, preferTrash?: boolean) => Promise<void>;
	deleteEmptyFolders: (path: Path) => Promise<void>;
	write: (path: Path, data: string | Buffer) => Promise<void>;
	move: (from: Path, to: Path) => Promise<void>;
	copy: (from: Path, to: Path) => Promise<void>;
	mkdir: (path: Path, mode?: number) => Promise<void>;
	createRootPathIfNeed: () => Promise<void>;
	watch: (onChange: (changeItems: ItemRefStatus[]) => void) => void;
	startWatch: () => void;
	stopWatch: () => void;
}
