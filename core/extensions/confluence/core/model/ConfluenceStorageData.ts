import ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import StorageData from "@ext/storage/models/StorageData";

interface ConfluenceStorageData extends StorageData {
	source: ConfluenceSourceData;
	id: string;
	displayName?: string;
}

export default ConfluenceStorageData;
