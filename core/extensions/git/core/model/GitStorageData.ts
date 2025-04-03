import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import StorageData from "../../../storage/models/StorageData";
import GitSourceData from "./GitSourceData.schema";

export interface PublicGitStorageData extends StorageData {
	url?: string;
	source: SourceData;
}

interface GitStorageData extends PublicGitStorageData {
	group: string;
	source: GitSourceData;
}

export default GitStorageData;
