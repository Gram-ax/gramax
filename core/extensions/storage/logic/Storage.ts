import Path from "../../../logic/FileProvider/Path/Path";
import Branch from "../../VersionControl/model/branch/Branch";
import ShareData from "../../catalog/actions/share/model/ShareData";
import StorageData from "../models/StorageData";
import StorageUrl from "../models/StorageUrl";
import SourceData from "./SourceDataProvider/model/SourceData";
import SourceType from "./SourceDataProvider/model/SourceType";

export default interface Storage {
	pull(source: SourceData, recursive?: boolean): Promise<void>;
	push(source: SourceData): Promise<void>;
	fetch(source: SourceData): Promise<void>;
	update(): Promise<void>;
	getSourceName(): Promise<string>;
	getStorageData(source: SourceData): Promise<StorageData>;
	getShareData(source: SourceData, branch: string, filePath: Path): Promise<ShareData>;
	getType: () => Promise<SourceType>;
	getUrl(): Promise<StorageUrl>;
	getName(): Promise<string>;
	getRemoteName(): Promise<string>;
	getFileLink(path: Path, branch?: Branch): Promise<string>;
	getStorageContainsItem(path: Path): Promise<{ storage: Storage; relativePath: Path }>;
	getSyncCount(): Promise<{ pull: number; push: number; hasChanges: boolean }>;
	updateSyncCount(): Promise<void>;
	setSyncSearchInPath(path: string): void;
}
