import type Path from "@core/FileProvider/Path/Path";
import type FileStructure from "@core/FileStructue/FileStructure";
import type NotionStorageData from "@ext/notion/model/NotionStorageData";

interface NotionImportData {
	fs: FileStructure;
	catalogPath: Path;
	data?: NotionStorageData;
}

export default NotionImportData;
