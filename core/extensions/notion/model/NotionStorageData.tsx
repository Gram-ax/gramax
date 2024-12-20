import NotionSourceData from "@ext/notion/model/NotionSourceData";
import StorageData from "@ext/storage/models/StorageData";

interface NotionStorageData extends StorageData {
	source: NotionSourceData;
}

export default NotionStorageData;
