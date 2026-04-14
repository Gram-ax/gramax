import type ConfluenceSourceData from "@ext/confluence/core/model/ConfluenceSourceData";
import type StorageData from "@ext/storage/models/StorageData";

interface ConfluenceStorageData extends StorageData {
	source: ConfluenceSourceData;
	id: string;
	displayName?: string;
}

export default ConfluenceStorageData;
