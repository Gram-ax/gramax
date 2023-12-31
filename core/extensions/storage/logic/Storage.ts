import Path from "../../../logic/FileProvider/Path/Path";
import Branch from "../../VersionControl/model/branch/Branch";
import ShareLinkData from "../../catalog/actions/share/model/ShareLinkData";
import StorageData from "../models/StorageData";
import StorageUrl from "../models/StorageUrl";
import SourceData from "./SourceDataProvider/model/SourceData";
import SourceType from "./SourceDataProvider/model/SourceType";

export default interface Storage {
	pull(source: SourceData, recursive?: boolean): Promise<void>;
	push(source: SourceData, recursive?: boolean): Promise<void>;
	fetch(source: SourceData): Promise<void>;
	update(): Promise<void>;
	getSourceName(): Promise<string>;
	getData(source: SourceData): Promise<StorageData>;
	getReviewData(source: SourceData, branch: string, filePath: Path): Promise<ShareLinkData>;
	getType: () => Promise<SourceType>;
	getUrl(): Promise<StorageUrl>;
	getName(): Promise<string>;
	getFileLink(path: Path, branch?: Branch): Promise<string>;
	getStorageContainsItem(path: Path): Promise<{ storage: Storage; relativePath: Path }>;
}
