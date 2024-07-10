import ConfluenceSourceData from "@ext/confluence/actions/Source/model/ConfluenceSourceData";
import StorageData from "@ext/storage/models/StorageData";

interface ConfluenceStorageData extends StorageData {
	source: ConfluenceSourceData;
	id: string;
	displayName?: string;
}

export default ConfluenceStorageData;
