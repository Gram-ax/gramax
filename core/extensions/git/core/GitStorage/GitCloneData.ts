import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import Progress from "../../../storage/models/Progress";
import GitSourceData from "../model/GitSourceData.schema";
import GitStorageData from "../model/GitStorageData";

interface GitCloneData {
	fp: FileProvider;
	repositoryPath: Path;
	source: GitSourceData;
	url?: string;
	branch?: string;
	recursive?: boolean;
	data?: GitStorageData;
	onProgress?: (p: Progress) => void;
}

export default GitCloneData;
