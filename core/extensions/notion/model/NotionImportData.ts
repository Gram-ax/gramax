import Path from "@core/FileProvider/Path/Path";
import FileStructure from "@core/FileStructue/FileStructure";
import NotionStorageData from "@ext/notion/model/NotionStorageData";

interface NotionImportData {
	fs: FileStructure;
	catalogPath: Path;
	data?: NotionStorageData;
}

export default NotionImportData;
