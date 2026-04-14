import type { Event, EventEmitter } from "@core/Event/EventEmitter";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type Path from "../../../logic/FileProvider/Path/Path";
import type ShareData from "../../catalog/actions/share/model/ShareData";
import type Branch from "../../VersionControl/model/branch/Branch";
import type StorageData from "../models/StorageData";
import type StorageUrl from "../models/StorageUrl";
import type SourceType from "./SourceDataProvider/model/SourceType";

export type StorageEvents = Event<"fetch", { storage: Storage; force: boolean }>;

export default interface Storage {
	pull(source: SourceData, recursive?: boolean): Promise<void>;
	push(source: SourceData, recursive?: boolean): Promise<void>;
	fetch(source: SourceData, force?: boolean, lock?: boolean): Promise<void>;
	update(): Promise<void>;
	getDefaultBranch(source: SourceData): Promise<Branch | null>;
	getSourceName(): Promise<string>;
	getStorageData(source: SourceData): Promise<StorageData>;
	getShareData(source: SourceData, branch: string, filePath: Path): Promise<ShareData>;
	getType: () => Promise<SourceType>;
	getUrl(): Promise<StorageUrl>;
	getName(): Promise<string>;
	getRemoteName(): Promise<string>;
	getFileLink(path: Path, branch?: Branch): Promise<string>;
	getStorageByPath(path: Path): Promise<{ storage: Storage; relativePath: Path }>;
	getSyncCount(): Promise<{ pull: number; push: number; hasChanges: boolean }>;
	updateSyncCount(): Promise<void>;
	setSyncSearchInPath(path: string): void;
	events: EventEmitter<StorageEvents>;
}
