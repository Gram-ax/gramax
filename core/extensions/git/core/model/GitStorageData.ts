import StorageData from "../../../storage/models/StorageData";
import GitSourceData from "./GitSourceData.schema";

interface GitStorageData extends StorageData {
	group: string;
	source: GitSourceData;
}

export default GitStorageData;
