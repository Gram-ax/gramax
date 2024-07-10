import FileProvider from "@core/FileProvider/model/FileProvider";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import Path from "@core/FileProvider/Path/Path";

interface ConfluenceImportData {
	fp: FileProvider;
	catalogPath: Path;
	data?: ConfluenceStorageData;
}

export default ConfluenceImportData;
