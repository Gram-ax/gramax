import StorageData from "@ext/storage/models/StorageData";
import YandexDiskSourceData from "@ext/yandexDisk/model/YandexDiskSourceData";

interface YandexStorageData extends StorageData {
	source: YandexDiskSourceData;
	id: string;
}

export default YandexStorageData;
