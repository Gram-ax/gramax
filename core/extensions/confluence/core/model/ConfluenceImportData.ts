import Path from "@core/FileProvider/Path/Path";
import type FileStructure from "@core/FileStructue/FileStructure";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";

interface ConfluenceImportData {
	fs: FileStructure;
	catalogPath: Path;
	data?: ConfluenceStorageData;
}

export default ConfluenceImportData;
