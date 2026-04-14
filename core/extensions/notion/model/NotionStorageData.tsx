import type NotionSourceData from "@ext/notion/model/NotionSourceData";
import type StorageData from "@ext/storage/models/StorageData";

interface NotionStorageData extends StorageData {
	source: NotionSourceData;
}

export default NotionStorageData;
