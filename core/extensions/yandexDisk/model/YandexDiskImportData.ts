import Path from "@core/FileProvider/Path/Path";
import FileStructure from "@core/FileStructue/FileStructure";
import YandexStorageData from "@ext/yandexDisk/model/YandexDiskStorageData";

interface YandexDiskImportData {
	fs: FileStructure;
	catalogPath: Path;
	data?: YandexStorageData;
}

export default YandexDiskImportData;
