import type FileStructure from "@core/FileStructue/FileStructure";
import type { CloneCancelToken, CloneProgress } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import Path from "../../../../logic/FileProvider/Path/Path";
import GitSourceData from "../model/GitSourceData.schema";
import GitStorageData from "../model/GitStorageData";

interface GitCloneData {
	fs: FileStructure;
	repositoryPath: Path;
	source: GitSourceData;
	cancelToken: CloneCancelToken;
	branch?: string;
	recursive?: boolean;
	data?: GitStorageData;
	isBare?: boolean;
	onProgress?: (p: CloneProgress) => void;
}

export default GitCloneData;
